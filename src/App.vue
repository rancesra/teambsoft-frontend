<script setup>
import { RouterLink, RouterView } from 'vue-router'

// Dentro del Host App, el módulo corre en un iframe y el encabezado lo pone el cascarón. Si el módulo
// pintara también el suyo, se verían dos (contrato del Host App v1.1, sección 4).
const embebido = window.self !== window.top
</script>

<template>
  <!--
    Este encabezado solo se ve cuando el módulo corre solo (npm run dev en este repositorio).
    Dentro del Host App no se monta: el cascarón ya pone el suyo arriba.
  -->
  <header v-if="!embebido" class="barra">
    <div class="contenedor barra-dentro">
      <span class="marca">Catálogo</span>
      <nav>
        <RouterLink to="/catalogo">Productos</RouterLink>
        <RouterLink to="/catalogo/admin">Administración</RouterLink>
      </nav>
      <span class="aviso">modo independiente</span>
    </div>
  </header>

  <main class="contenedor">
    <RouterView />
  </main>
</template>

<style scoped>
.barra {
  background: var(--superficie);
  border-bottom: 1px solid var(--borde);
}

.barra-dentro {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 14px;
  padding-bottom: 14px;
}

.marca {
  font-weight: 700;
  font-size: 16px;
}

nav {
  display: flex;
  gap: 18px;
}

nav a {
  color: var(--texto-suave);
  text-decoration: none;
  font-size: 14px;
}

nav a.router-link-active {
  color: var(--acento);
  font-weight: 600;
}

.aviso {
  margin-left: auto;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--aviso);
  border: 1px dashed var(--aviso);
  border-radius: 999px;
  padding: 2px 10px;
}
</style>