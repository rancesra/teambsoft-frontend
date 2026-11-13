<script setup>
import { estaEmbebido } from '@/utilidades/hostApp'
import { iniciarSesion, sesion } from '@/utilidades/sesion'

// Se muestra en lugar de las vistas de administración cuando el usuario no tiene el rol admin.
// Sin esto, la vista cargaría y cada botón respondería 401 o 403 del backend.
const embebido = estaEmbebido()
</script>

<template>
  <section class="acceso">
    <span class="icono">🔒</span>
    <template v-if="sesion.usuario">
      <h2>Esta sección es solo para administradores</h2>
      <p>
        Iniciaste sesión como <strong>{{ sesion.usuario.nombre }}</strong>, que no tiene el rol
        <code>admin</code>.
      </p>
    </template>
    <template v-else>
      <h2>Inicia sesión para administrar el catálogo</h2>
      <p>Crear, editar y desactivar productos necesita una cuenta con el rol <code>admin</code>.</p>
      <button class="boton" @click="iniciarSesion()">
        {{ embebido ? 'Iniciar sesión en la tienda' : 'Iniciar sesión' }}
      </button>
    </template>
    <RouterLink to="/catalogo" class="volver">Volver al catálogo</RouterLink>
  </section>
</template>

<style scoped>
.acceso {
  max-width: 460px;
  margin: 64px auto;
  text-align: center;
  color: var(--texto-suave);
}

.icono {
  display: block;
  font-size: 32px;
  margin-bottom: 10px;
  opacity: 0.7;
}

h2 {
  font-size: 19px;
  color: var(--texto);
  margin: 0 0 8px;
}

p {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 18px;
}

.volver {
  display: block;
  margin-top: 16px;
  font-size: 14px;
  color: var(--acento);
}
</style>
