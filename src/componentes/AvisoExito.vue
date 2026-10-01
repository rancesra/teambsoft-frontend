<script setup>
// Avisa que una operación salió bien y se va sola. Los errores se quedan; los éxitos no, porque
// el usuario ya ve el resultado en la pantalla.
import { onMounted, onUnmounted, ref } from 'vue'

defineProps({ mensaje: { type: String, required: true } })
const emit = defineEmits(['cerrar'])

const visible = ref(true)
let reloj

onMounted(() => {
  reloj = setTimeout(() => {
    visible.value = false
    emit('cerrar')
  }, 4000)
})

onUnmounted(() => clearTimeout(reloj))
</script>

<template>
  <div v-if="visible" class="exito" role="status">
    <strong>✓</strong>
    <span>{{ mensaje }}</span>
  </div>
</template>

<style scoped>
.exito {
  display: flex;
  gap: 10px;
  align-items: center;
  background: var(--acento-suave);
  border-left: 3px solid var(--ok);
  border-radius: 0 var(--radio-chico) var(--radio-chico) 0;
  padding: 12px 15px;
  color: #166534;
  font-size: 14px;
  margin-bottom: 18px;
}
</style>