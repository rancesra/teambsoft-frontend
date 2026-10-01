<script setup>
// Estado "cargando" del contrato: mientras la llamada va en camino nunca se deja la pantalla vacía.
// Se dibujan cajas grises del tamaño del contenido real para que la página no salte al llegar.
defineProps({ cuantas: { type: Number, default: 8 } })
</script>

<template>
  <div class="esqueletos">
    <div v-for="n in cuantas" :key="n" class="esqueleto tarjeta"></div>
  </div>
</template>

<style scoped>
.esqueletos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(198px, 1fr));
  gap: 18px;
}

.esqueleto {
  height: 240px;
  background: linear-gradient(90deg, #f5f5f4, #edebe9, #f5f5f4);
  background-size: 200% 100%;
  animation: brillo 1.4s infinite;
  box-shadow: none;
}

@keyframes brillo {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>