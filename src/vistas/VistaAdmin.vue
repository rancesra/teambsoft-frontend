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
// Lo más que deja pedir el contrato por página (sección 2). Se usa solo para buscar por nombre.
const TAMANO_MAXIMO = 100

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
// Lo que se busca por nombre también va en la URL: al editar un producto y volver, la búsqueda sigue.
const busqueda = computed(() => (route.query.buscar ?? '').trim())
const textoBusqueda = ref(route.query.buscar ?? '')

function irA(cambios) {
  router.push({ query: { ...route.query, ...cambios } })
}

// Sin tildes ni mayúsculas, para que «lampara» encuentre «Lámpara».
function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * El contrato no tiene búsqueda por texto en GET /productos: buscar es trabajo de Búsqueda, que solo
 * indexa los activos. Para que la administración encuentre también los retirados sin cambiar el
 * contrato, se traen todos los del filtro, de 100 en 100, y se filtran aquí por nombre. Con unos
 * cientos de productos son dos o tres peticiones.
 */
async function buscarPorNombre() {
  const todos = []
  for (let numero = 1; ; numero++) {
    const parametros = new URLSearchParams({
      pagina: numero,
      tamanoPagina: TAMANO_MAXIMO,
      activo: filtroActivo.value,
    })
    const respuesta = await api.get(`/productos?${parametros}`)
    todos.push(...respuesta.productos)
    if (respuesta.productos.length < TAMANO_MAXIMO) break
  }
  const buscado = normalizar(busqueda.value)
  const encontrados = todos.filter((p) => normalizar(p.nombre).includes(buscado))
  const desde = (pagina.value - 1) * TAMANO_PAGINA
  return { productos: encontrados.slice(desde, desde + TAMANO_PAGINA), total: encontrados.length }
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    if (categorias.value.length === 0) {
      categorias.value = await api.get('/categorias')
    }
    let respuesta
    if (busqueda.value) {
      respuesta = await buscarPorNombre()
    } else {
      const parametros = new URLSearchParams({
        pagina: pagina.value,
        tamanoPagina: TAMANO_PAGINA,
        activo: filtroActivo.value,
      })
      respuesta = await api.get(`/productos?${parametros}`)
    }
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

// Se espera a que el usuario deje de escribir un momento antes de buscar, para no pedir la lista
// completa con cada letra. replace y no push: cada letra no debe quedar en el historial.
let espera = null
watch(textoBusqueda, (texto) => {
  clearTimeout(espera)
  espera = setTimeout(() => {
    router.replace({ query: { ...route.query, buscar: texto.trim() || undefined, pagina: undefined } })
  }, 300)
})

// Con atrás y adelante del navegador cambia la URL sin pasar por el campo: se pone al día.
watch(
  () => route.query.buscar ?? '',
  (enLaUrl) => {
    if (enLaUrl.trim() !== textoBusqueda.value.trim()) textoBusqueda.value = enLaUrl
  },
)

watch([filtroActivo, pagina, busqueda], cargar, { immediate: true })
</script>

<template>
  <header class="titulo">
    <h1>Productos</h1>
    <span v-if="!cargando && !error">{{ total }} {{ !busqueda ? 'en total' : total === 1 ? 'encontrado' : 'encontrados' }}</span>
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

    <input
      v-model="textoBusqueda"
      class="campo buscador"
      type="search"
      placeholder="Buscar por nombre…"
      aria-label="Buscar productos por nombre"
    />
  </div>

  <MensajeError v-if="error" :error="error" @reintentar="cargar" />

  <p v-else-if="cargando" class="cargando">Cargando…</p>

  <EstadoVacio
    v-else-if="productos.length === 0"
    :mensaje="busqueda ? `Ningún producto se llama como «${busqueda}» en este filtro.` : 'No hay productos con este filtro.'"
  >
    <button v-if="busqueda" class="boton secundario" @click="textoBusqueda = ''">Quitar la búsqueda</button>
  </EstadoVacio>

  <template v-else>
    <!-- En el celular la tabla no cabe: se desliza de lado dentro de su recuadro, y así Editar y
         Desactivar siguen a la mano. -->
    <div class="marco-tabla tarjeta">
      <table class="tabla">
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
    </div>

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
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.buscador {
  margin-left: auto;
  width: 240px;
  padding: 7px 12px;
}

.marco-tabla {
  overflow-x: auto;
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
  color: var(--texto-sobre-acento);
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th {
  background: var(--fondo-suave);
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
  background: var(--fondo-suave);
  color: var(--texto-suave);
}

/* Sin display: flex en la celda: una celda flex deja de centrarse en la fila y los botones quedaban
   pegados arriba. */
.acciones {
  text-align: right;
  white-space: nowrap;
}

.accion + .accion {
  margin-left: 14px;
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

@media (max-width: 600px) {
  .buscador {
    margin-left: 0;
    width: 100%;
  }

  /* Un ancho mínimo para que el nombre no se parta palabra por palabra: lo que no cabe se desliza. */
  .tabla {
    min-width: 560px;
  }
}
</style>
