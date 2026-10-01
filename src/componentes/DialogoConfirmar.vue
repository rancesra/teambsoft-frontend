<script setup>
// Diálogo de confirmación para las acciones que cambian el catálogo público. Usa <dialog>, que es
// del navegador: atrapa el foco y cierra con Escape sin que haya que programarlo.
import { onMounted, ref } from 'vue'

defineProps({
  titulo: { type: String, required: true },
  mensaje: { type: String, default: '' },
  textoConfirmar: { type: String, default: 'Confirmar' },
  peligroso: { type: Boolean, default: false },
})
const emit = defineEmits(['confirmar', 'cancelar'])

const dialogo = ref(null)
onMounted(() => dialogo.value.showModal())
</script>

<template>
  <dialog ref="dialogo" class="dialogo" @cancel.prevent="emit('cancelar')">
    <h2>{{ titulo }}</h2>
    <p v-if="mensaje">{{ mensaje }}</p>
    <div class="acciones">
      <button class="boton secundario" @click="emit('cancelar')">Cancelar</button>
      <button class="boton" :class="{ peligro: peligroso }" @click="emit('confirmar')">
        {{ textoConfirmar }}
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.dialogo {
  border: 1px solid var(--borde);
  border-radius: var(--radio);
  box-shadow: 0 14px 36px rgba(28, 25, 23, 0.16);
  padding: 22px;
  max-width: 400px;
  color: var(--texto);
}

.dialogo::backdrop {
  background: rgba(28, 25, 23, 0.35);
}

h2 {
  font-size: 16px;
  margin: 0 0 8px;
}

p {
  font-size: 14px;
  color: var(--texto-suave);
  margin: 0;
}

.acciones {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>