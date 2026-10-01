<script setup>
import { RouterLink } from 'vue-router'

import EstadoVacio from '@/componentes/EstadoVacio.vue'
</script>

<template>
  <EstadoVacio icono="🧭" mensaje="Esta página no existe.">
    <RouterLink class="boton" to="/catalogo">Volver al catálogo</RouterLink>
  </EstadoVacio>
</template>

<style scoped>
.boton {
  text-decoration: none;
  display: inline-block;
}
</style>