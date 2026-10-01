<script setup>
// Estado "lista vacía": una categoría sin productos responde 200 con total 0, no es un error.
defineProps({
  icono: { type: String, default: '🗂️' },
  mensaje: { type: String, required: true },
})
</script>

<template>
  <div class="vacio tarjeta">
    <span class="icono">{{ icono }}</span>
    <p>{{ mensaje }}</p>
    <slot />
  </div>
</template>

<style scoped>
.vacio {
  text-align: center;
  padding: 48px 24px;
  color: var(--texto-suave);
  box-shadow: none;
}

.icono {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
  opacity: 0.55;
}

p {
  margin: 0 0 12px;
}
</style>