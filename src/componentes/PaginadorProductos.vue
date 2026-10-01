<script setup>
import { computed } from 'vue'

// La primera página es la 1, no la 0 (contrato, sección 2). Este componente es el único que hace
// esa cuenta, para que ninguna vista se equivoque.
const props = defineProps({
  pagina: { type: Number, required: true },
  total: { type: Number, required: true },
  tamanoPagina: { type: Number, required: true },
})
defineEmits(['cambiar'])

const ultimaPagina = computed(() => Math.max(1, Math.ceil(props.total / props.tamanoPagina)))
const paginas = computed(() => Array.from({ length: ultimaPagina.value }, (_, i) => i + 1))
</script>

<template>
  <nav v-if="ultimaPagina > 1" class="paginas" aria-label="Paginación">
    <button class="pagina" :disabled="pagina === 1" @click="$emit('cambiar', pagina - 1)">‹</button>
    <button
      v-for="n in paginas"
      :key="n"
      class="pagina"
      :class="{ actual: n === pagina }"
      @click="$emit('cambiar', n)"
    >
      {{ n }}
    </button>
    <button class="pagina" :disabled="pagina === ultimaPagina" @click="$emit('cambiar', pagina + 1)">
      ›
    </button>
  </nav>
</template>

<style scoped>
.paginas {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 28px;
}

.pagina {
  min-width: 34px;
  height: 34px;
  border: 1px solid var(--borde);
  background: var(--superficie);
  border-radius: var(--radio-chico);
  color: var(--texto-suave);
  font: 500 13px var(--fuente);
  cursor: pointer;
}

.pagina.actual {
  background: var(--acento);
  border-color: var(--acento);
  color: #fff;
  font-weight: 700;
}

.pagina:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

