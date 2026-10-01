<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { api } from '@/api/cliente'
import AvisoExito from '@/componentes/AvisoExito.vue'
import DialogoConfirmar from '@/componentes/DialogoConfirmar.vue'
import EstadoVacio from '@/componentes/EstadoVacio.vue'
import MensajeError from '@/componentes/MensajeError.vue'
import PaginadorProductos from '@/componentes/PaginadorProductos.vue'
import { enPesos, nombreDeCategoria } from '@/utilidades/formato'

const TAMANO_PAGINA = 20

const route = useRoute()
const router = useRouter()

const productos = ref([])
const categorias = ref([])
const total = ref(0)
const cargando = ref(true)
const error = ref(null)
const exito = ref(null)
const porConfirmar = ref(null)

// activo=true (activos), false (retirados) o todos. Va en la URL, igual que en el listado público.
const filtroActivo = computed(() => route.query.activo ?? 'true')
const pagina = computed(() => Number(route.query.pagina ?? 1))

function irA(cambios) {
  router.push({ query: { ...route.query, ...cambios } })
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    if (categorias.value.length === 0) {
      categorias.value = await api.get('/categorias')
    }
    const parametros = new URLSearchParams({
      pagina: pagina.value,
      tamanoPagina: TAMANO_PAGINA,
      activo: filtroActivo.value,
    })
    const respuesta = await api.get(`/productos?${parametros}`)
    productos.value = respuesta.productos
    total.value = respuesta.total
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

function pedirConfirmacion(producto) {
  porConfirmar.value = producto
}

async function ejecutarAccion() {
  const producto = porConfirmar.value
  porConfirmar.value = null
  try {
    if (producto.activo) {
      await api.borrar(`/productos/${producto.id}`)
      exito.value = `"${producto.nombre}" fue retirado del catálogo.`
    } else {
      await api.post(`/productos/${producto.id}/activar`)
      exito.value = `"${producto.nombre}" volvió al catálogo.`
    }
    await cargar()
  } catch (e) {
    error.value = e
  }
}

watch([filtroActivo, pagina], cargar, { immediate: true })
</script>

<template>
  <header class="titulo">
    <h1>Productos</h1>
    <span v-if="!cargando && !error">{{ total }} en total</span>
    <RouterLink class="boton" to="/catalogo/admin/nuevo">+ Nuevo producto</RouterLink>
  </header>

  <AvisoExito v-if="exito" :mensaje="exito" @cerrar="exito = null" />

  <div class="filtros">
    <button class="chip" :class="{ activo: filtroActivo === 'true' }" @click="irA({ activo: undefined, pagina: undefined })">
      Activos
    </button>
    <button class="chip" :class="{ activo: filtroActivo === 'false' }" @click="irA({ activo: 'false', pagina: undefined })">
      Retirados
    </button>
    <button class="chip" :class="{ activo: filtroActivo === 'todos' }" @click="irA({ activo: 'todos', pagina: undefined })">
      Todos
    </button>
  </div>

  <MensajeError v-if="error" :error="error" @reintentar="cargar" />

  <p v-else-if="cargando" class="cargando">Cargando…</p>

  <EstadoVacio v-else-if="productos.length === 0" mensaje="No hay productos con este filtro." />

  <template v-else>
    <table class="tabla tarjeta">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in productos" :key="p.id">
          <td>
            <strong>{{ p.nombre }}</strong>
            <span class="categoria">{{ nombreDeCategoria(p.categoria, categorias) }}</span>
          </td>
          <td class="numero">{{ enPesos(p.precio) }}</td>
          <td class="numero">{{ p.stock }}</td>
          <td>
            <span class="estado" :class="p.activo ? 'act' : 'ina'">
              {{ p.activo ? 'Activo' : 'Retirado' }}
            </span>
          </td>
          <td class="acciones">
            <RouterLink class="accion" :to="`/catalogo/admin/${p.id}`">Editar</RouterLink>
            <button class="accion" :class="{ peligro: p.activo }" @click="pedirConfirmacion(p)">
              {{ p.activo ? 'Desactivar' : 'Reactivar' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <PaginadorProductos
      :pagina="pagina"
      :total="total"
      :tamano-pagina="TAMANO_PAGINA"
      @cambiar="(n) => irA({ pagina: n })"
    />
  </template>

  <DialogoConfirmar
    v-if="porConfirmar"
    :titulo="porConfirmar.activo ? `¿Retirar &quot;${porConfirmar.nombre}&quot;?` : `¿Reactivar &quot;${porConfirmar.nombre}&quot;?`"
    :mensaje="porConfirmar.activo
      ? 'Dejará de aparecer en el catálogo público. Podrás reactivarlo después desde el filtro Retirados.'
      : 'Volverá a aparecer en el catálogo público con los mismos datos.'"
    :texto-confirmar="porConfirmar.activo ? 'Desactivar' : 'Reactivar'"
    :peligroso="porConfirmar.activo"
    @confirmar="ejecutarAccion"
    @cancelar="porConfirmar = null"
  />
</template>

<style scoped>
.titulo {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

h1 {
  font-size: 24px;
  letter-spacing: -0.02em;
  margin: 0;
}

.titulo span {
  color: var(--texto-suave);
  font-size: 13px;
}

.titulo .boton {
  margin-left: auto;
  text-decoration: none;
}

.filtros {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.chip {
  border: 1px solid var(--borde);
  background: var(--superficie);
  color: var(--texto-suave);
  border-radius: 999px;
  padding: 6px 15px;
  font: 500 13px var(--fuente);
  cursor: pointer;
}

.chip.activo {
  background: var(--acento);
  border-color: var(--acento);
  color: #fff;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  overflow: hidden;
  font-size: 14px;
}

th {
  background: #f5f5f4;
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--texto-suave);
  padding: 11px 14px;
}

td {
  padding: 13px 14px;
  border-top: 1px solid var(--borde);
  vertical-align: middle;
}

.categoria {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--texto-suave);
}

.numero {
  font-variant-numeric: tabular-nums;
}

.estado {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
}

.estado.act {
  background: var(--acento-suave);
  color: var(--ok);
}

.estado.ina {
  background: #f5f5f4;
  color: var(--texto-suave);
}

.acciones {
  display: flex;
  gap: 14px;
  justify-content: flex-end;
}

.accion {
  background: none;
  border: none;
  padding: 0;
  font: 600 13px var(--fuente);
  color: var(--acento);
  cursor: pointer;
  text-decoration: none;
}

.accion.peligro {
  color: var(--error);
}

.cargando {
  color: var(--texto-suave);
}
</style>