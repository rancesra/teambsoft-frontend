<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api } from '@/api/cliente'
import CargandoTarjetas from '@/componentes/CargandoTarjetas.vue'
import EstadoVacio from '@/componentes/EstadoVacio.vue'
import MensajeError from '@/componentes/MensajeError.vue'
import PaginadorProductos from '@/componentes/PaginadorProductos.vue'
import TarjetaProducto from '@/componentes/TarjetaProducto.vue'

const TAMANO_PAGINA = 20

const route = useRoute()
const router = useRouter()

const productos = ref([])
const categorias = ref([])
const total = ref(0)
const cargando = ref(true)
const error = ref(null)

// El filtro y la página viven en la URL, no en una variable suelta: así, recargar o compartir el
// enlace conserva lo que el usuario estaba viendo, en vez de devolverlo a la primera página.
const categoria = computed(() => route.query.categoria ?? null)
const pagina = computed(() => Number(route.query.pagina ?? 1))

function irA(cambios) {
  router.push({ query: { ...route.query, ...cambios } })
}

function filtrarPor(idCategoria) {
  // Al cambiar de categoría se vuelve a la página 1: quedarse en la 3 de un filtro nuevo casi
  // siempre muestra una lista vacía y parece un error.
  irA({ categoria: idCategoria ?? undefined, pagina: undefined })
}

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    // Las categorías solo se piden una vez: son fijas y se usan para traducir el id a nombre.
    if (categorias.value.length === 0) {
      categorias.value = await api.get('/categorias')
    }

    const parametros = new URLSearchParams({ pagina: pagina.value, tamanoPagina: TAMANO_PAGINA })
    if (categoria.value) parametros.set('categoria', categoria.value)

    const respuesta = await api.get(`/productos?${parametros}`)
    productos.value = respuesta.productos
    total.value = respuesta.total
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

// immediate: true hace la primera carga; después se repite cada vez que cambia la URL.
watch([categoria, pagina], cargar, { immediate: true })
</script>

<template>
  <header class="titulo">
    <h1>Catálogo</h1>
    <span v-if="!cargando && !error">{{ total }} productos · página {{ pagina }}</span>
  </header>

  <div class="filtros">
    <button class="chip" :class="{ activo: !categoria }" @click="filtrarPor(null)">Todas</button>
    <button
      v-for="c in categorias"
      :key="c.id"
      class="chip"
      :class="{ activo: categoria === c.id }"
      @click="filtrarPor(c.id)"
    >
      {{ c.nombre }}
    </button>
  </div>

  <MensajeError v-if="error" :error="error" @reintentar="cargar" />

  <CargandoTarjetas v-else-if="cargando" />

  <EstadoVacio
    v-else-if="productos.length === 0"
    mensaje="No hay productos en esta categoría."
  >
    <button v-if="categoria" class="boton secundario" @click="filtrarPor(null)">
      Ver todo el catálogo
    </button>
  </EstadoVacio>

  <template v-else>
    <div class="rejilla">
      <TarjetaProducto
        v-for="p in productos"
        :key="p.id"
        :producto="p"
        :categorias="categorias"
      />
    </div>

    <PaginadorProductos
      :pagina="pagina"
      :total="total"
      :tamano-pagina="TAMANO_PAGINA"
      @cambiar="(n) => irA({ pagina: n })"
    />
  </template>
</template>

<style scoped>
.titulo {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
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

.filtros {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 16px 0 22px;
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

.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(198px, 1fr));
  gap: 18px;
}
</style>
