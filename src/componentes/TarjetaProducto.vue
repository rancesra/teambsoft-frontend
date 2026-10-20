<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { enPesos, nombreDeCategoria } from '@/utilidades/formato'

const props = defineProps({
  producto: { type: Object, required: true },
  categorias: { type: Array, default: () => [] },
})

// El stock es un número del contrato; estas tres variantes son decisión nuestra de interfaz.
const estadoStock = computed(() => {
  if (props.producto.stock === 0) return { clase: 'sin', texto: 'Sin stock' }
  if (props.producto.stock <= 10) return { clase: 'poco', texto: `Quedan ${props.producto.stock}` }
  return { clase: 'hay', texto: `${props.producto.stock} disponibles` }
})
</script>

<template>
  <RouterLink class="producto tarjeta" :to="`/catalogo/${producto.id}`">
    <div class="foto">
      <img v-if="producto.imagenes?.length" :src="producto.imagenes[0]" :alt="producto.nombre" />
      <span v-else class="sin-foto">sin imagen</span>
    </div>

    <div class="cuerpo">
      <span class="categoria">{{ nombreDeCategoria(producto.categoria, categorias) }}</span>
      <h3>{{ producto.nombre }}</h3>
      <p class="precio">{{ enPesos(producto.precio) }}</p>
      <span class="stock" :class="estadoStock.clase">{{ estadoStock.texto }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.producto {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
}

.foto {
  aspect-ratio: 4 / 3;
  background: #f0efed;
  display: grid;
  place-items: center;
}

.foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sin-foto {
  font-size: 11px;
  color: #a8a29e;
  letter-spacing: 0.06em;
}

.cuerpo {
  padding: 13px 14px 15px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.categoria {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--texto-suave);
  font-weight: 600;
}

h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 4px 0 auto;
  line-height: 1.35;
}

.precio {
  font-size: 19px;
  font-weight: 700;
  margin: 11px 0 0;
  font-variant-numeric: tabular-nums;
}

.stock {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 999px;
  margin-top: 7px;
  width: fit-content;
}

.stock.hay {
  background: var(--acento-suave);
  color: var(--ok);
}

.stock.poco {
  background: #fffbeb;
  color: var(--aviso);
}

.stock.sin {
  background: #f5f5f4;
  color: var(--texto-suave);
}
</style>
