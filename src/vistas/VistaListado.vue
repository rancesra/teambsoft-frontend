<script setup>
import { onMounted, ref } from 'vue'

import { api } from '@/api/cliente'
import CargandoTarjetas from '@/componentes/CargandoTarjetas.vue'
import EstadoVacio from '@/componentes/EstadoVacio.vue'
import MensajeError from '@/componentes/MensajeError.vue'

// F1 deja aquí el esqueleto: la llamada, los tres estados y el filtro de categorías, que es lo
// único que se puede probar hoy porque GET /categorias ya está en main. F2 reemplaza el bloque
// marcado con la rejilla de productos (Historia 2).

const categorias = ref([])
const cargando = ref(true)
const error = ref(null)

async function cargar() {
  cargando.value = true
  error.value = null
  try {
    categorias.value = await api.get('/categorias')
  } catch (e) {
    error.value = e
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <h1>Catálogo</h1>

  <MensajeError v-if="error" :error="error" @reintentar="cargar" />

  <template v-else>
    <div v-if="!cargando" class="filtros">
      <button class="chip activo">Todas</button>
      <button v-for="c in categorias" :key="c.id" class="chip">{{ c.nombre }}</button>
    </div>

    <!-- F2: reemplaza este bloque por la rejilla de productos -->
    <CargandoTarjetas v-if="cargando" />
    <EstadoVacio v-else mensaje="Aquí va la rejilla de productos (tarea F2)." />
  </template>
</template>

<style scoped>
h1 {
  font-size: 24px;
  letter-spacing: -0.02em;
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
  color: #fff;
}
</style>