<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'

import AccesoAdmin from '@/componentes/AccesoAdmin.vue'
import { estaEmbebido } from '@/utilidades/hostApp'
import { cerrarSesion, esAdmin, iniciarSesion, sesion } from '@/utilidades/sesion'

// Dentro del Host App, el módulo corre en un iframe y el encabezado lo pone el cascarón. Si el módulo
// pintara también el suyo, se verían dos (contrato del Host App v1.1, sección 4).
const embebido = estaEmbebido()
const route = useRoute()
const loginDisponible = Boolean(import.meta.env.VITE_KEYCLOAK_URL)
</script>

<template>
  <!--
    Este encabezado solo se ve cuando el módulo corre solo (npm run dev en este repositorio).
    Dentro del Host App no se monta: el cascarón ya pone el suyo arriba, con su propio login.
  -->
  <header v-if="!embebido" class="barra">
    <div class="contenedor barra-dentro">
      <span class="marca">Catálogo</span>
      <nav>
        <RouterLink to="/catalogo">Productos</RouterLink>
        <RouterLink to="/catalogo/admin">Administración</RouterLink>
      </nav>
      <span class="aviso">modo independiente</span>
      <div v-if="loginDisponible" class="cuenta">
        <template v-if="sesion.usuario">
          <span>{{ sesion.usuario.nombre }}</span>
          <button class="enlace" @click="cerrarSesion()">Cerrar sesión</button>
        </template>
        <button v-else class="enlace" @click="iniciarSesion()">Iniciar sesión</button>
      </div>
    </div>
  </header>

  <main class="contenedor">
    <!-- Las vistas de administración piden el rol admin (contrato v2.5, sección 2). -->
    <AccesoAdmin v-if="route.meta.soloAdmin && !esAdmin" />
    <RouterView v-else />
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
.cuenta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.enlace {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: var(--acento);
  cursor: pointer;
}
</style>
