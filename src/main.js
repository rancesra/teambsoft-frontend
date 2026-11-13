import { createApp } from 'vue'

import { prepararSesion } from './utilidades/sesion'
import './estilos.css'

// Primero la sesión: si el usuario vuelve de Keycloak, se termina el inicio de sesión y se corrige
// la dirección; si el módulo está dentro del Host App, se le pide la sesión al cascarón.
await prepararSesion()

// El enrutador se importa después a propósito: lee la dirección del navegador en el momento en que
// se crea, y si se creara antes vería /sesion?code=... y mostraría "página no encontrada".
const { default: App } = await import('./App.vue')
const { default: router } = await import('./router')

createApp(App).use(router).mount('#app')
