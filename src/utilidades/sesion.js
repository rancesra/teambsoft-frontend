// La sesión del usuario en el módulo de Catálogo (contrato del Host App v1.3, sección 5).
//
// Hay dos casos, y el módulo funciona en los dos (la regla de oro del contrato):
//
//  - Dentro del Host App: el login lo hace el cascarón. El módulo le pide la sesión con el mensaje
//    "pedir-sesion" y la recibe con "sesion". Para iniciarla, le manda "iniciar-sesion".
//  - Solo (npm run dev en este repositorio): no hay cascarón, así que el módulo hace el login por su
//    cuenta, con el mismo flujo que el Host App: lleva al usuario a Keycloak y vuelve con un código.
//
// El flujo es "authorization code con PKCE": como el navegador no puede guardar un secreto, en cada
// inicio de sesión se inventa uno de un solo uso (el verificador) y a Keycloak solo se le muestra su
// huella (el reto). Quien robe el código de la dirección no puede usarlo sin el verificador.

import { computed, reactive, readonly } from 'vue'

import { estaEmbebido } from '@/utilidades/hostApp'

const EMISOR = import.meta.env.VITE_KEYCLOAK_URL // http://localhost:8180/realms/tienda
const CLIENTE = import.meta.env.VITE_KEYCLOAK_CLIENTE || 'tienda-web'
// De qué dirección se acepta la sesión cuando el módulo está dentro del Host App.
const ORIGEN_HOST_APP = import.meta.env.VITE_HOST_APP || 'http://localhost:5050'

const RUTA_DE_REGRESO = '/sesion'
const CLAVE_SESION = 'catalogo.sesion'
const CLAVE_PKCE = 'catalogo.pkce'

const estado = reactive({ token: null, usuario: null })

/** La sesión actual, solo para leer: `{ token, usuario }`, o los dos en null si no hay sesión. */
export const sesion = readonly(estado)

/** ¿El usuario tiene el rol admin? Es lo que pide el backend para crear, editar y desactivar. */
export const esAdmin = computed(() => Boolean(estado.usuario?.roles.includes('admin')))

// --- Funciones puras (se prueban en __tests__/sesion.spec.js) ------------------------------------

/** Base64 "para URL": sin +, / ni =, que en una dirección significan otra cosa. */
export function base64Url(bytes) {
  let texto = ''
  for (const b of bytes) texto += String.fromCharCode(b)
  return btoa(texto).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** El secreto de un solo uso de PKCE: 32 bytes al azar. */
export function generarVerificador() {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)))
}

/** La huella del verificador (SHA-256), que es lo único que ve Keycloak al empezar. */
export async function retoDe(verificador) {
  const huella = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verificador))
  return base64Url(new Uint8Array(huella))
}

/**
 * Lee lo que dice un token. No comprueba la firma: eso lo hace el backend con la llave de Keycloak.
 * Aquí solo sirve para mostrar el nombre, saber los roles y saber cuándo vence.
 */
export function leerToken(jwt) {
  const parte = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(parte), (c) => c.charCodeAt(0))
  const datos = JSON.parse(new TextDecoder().decode(bytes))
  return {
    id: datos.sub,
    usuario: datos.preferred_username,
    nombre: datos.name || datos.preferred_username,
    roles: datos.realm_access?.roles ?? [],
    vence: datos.exp * 1000,
  }
}

/**
 * Decide si un mensaje es la sesión que manda el Host App. Solo se acepta del origen del Host App:
 * cualquier página puede mandarle mensajes a este iframe, y una sesión falsa sería suplantación.
 *
 * @returns {{ token: string|null, usuario: object|null } | null} la sesión, o null si se ignora.
 */
export function sesionDelMensaje(evento, origenHostApp = ORIGEN_HOST_APP) {
  if (evento.origin !== origenHostApp) return null
  const datos = evento.data
  if (!datos || datos.tipo !== 'sesion') return null
  if (datos.token !== null && typeof datos.token !== 'string') return null
  return { token: datos.token, usuario: datos.token ? datos.usuario : null }
}

// --- Dentro del Host App -------------------------------------------------------------------------

function escucharAlHostApp() {
  window.addEventListener('message', (evento) => {
    const recibida = sesionDelMensaje(evento)
    if (!recibida) return
    estado.token = recibida.token
    estado.usuario = recibida.usuario
  })
  // El Host App manda la sesión al cargar el iframe, pero se pide igual por si este módulo terminó
  // de arrancar después de ese primer mensaje.
  window.parent.postMessage({ tipo: 'pedir-sesion' }, ORIGEN_HOST_APP)
}

// --- Inicio y cierre de sesión -------------------------------------------------------------------

/** Lleva al usuario a iniciar sesión. Dentro del Host App, se lo pide al cascarón. */
export async function iniciarSesion(volverA = window.location.pathname + window.location.search) {
  if (estaEmbebido()) {
    window.parent.postMessage({ tipo: 'iniciar-sesion' }, ORIGEN_HOST_APP)
    return
  }
  if (!EMISOR) return

  const verificador = generarVerificador()
  const estadoAleatorio = generarVerificador()
  sessionStorage.setItem(CLAVE_PKCE, JSON.stringify({ verificador, estado: estadoAleatorio, volverA }))

  const parametros = new URLSearchParams({
    client_id: CLIENTE,
    redirect_uri: window.location.origin + RUTA_DE_REGRESO,
    response_type: 'code',
    scope: 'openid',
    code_challenge: await retoDe(verificador),
    code_challenge_method: 'S256',
    state: estadoAleatorio,
  })
  window.location.assign(`${EMISOR}/protocol/openid-connect/auth?${parametros}`)
}

/** Cierra la sesión aquí y en Keycloak. Dentro del Host App no se usa: el botón está en el cascarón. */
export function cerrarSesion() {
  const guardada = leerGuardada()
  olvidar()
  const parametros = new URLSearchParams({
    client_id: CLIENTE,
    post_logout_redirect_uri: window.location.origin + '/',
  })
  if (guardada?.idToken) parametros.set('id_token_hint', guardada.idToken)
  window.location.assign(`${EMISOR}/protocol/openid-connect/logout?${parametros}`)
}

/** Se llama una vez, antes de montar la aplicación. */
export async function prepararSesion() {
  if (estaEmbebido()) {
    escucharAlHostApp()
    return
  }
  if (!EMISOR) return

  if (window.location.pathname === RUTA_DE_REGRESO) {
    await completarInicioDeSesion()
    return
  }

  const guardada = leerGuardada()
  if (!guardada) return
  if (leerToken(guardada.token).vence > Date.now() + 10_000) {
    aplicar(guardada)
  } else {
    await renovar(guardada.renovacion)
  }
}

async function completarInicioDeSesion() {
  const parametros = new URLSearchParams(window.location.search)
  const pkce = JSON.parse(sessionStorage.getItem(CLAVE_PKCE) || 'null')
  sessionStorage.removeItem(CLAVE_PKCE)
  const volverA = pkce?.volverA || '/'

  try {
    if (!pkce || parametros.get('state') !== pkce.estado || !parametros.get('code')) {
      throw new Error('La respuesta de Keycloak no corresponde a un inicio de sesión de esta pestaña')
    }
    await pedirTokens({
      grant_type: 'authorization_code',
      code: parametros.get('code'),
      redirect_uri: window.location.origin + RUTA_DE_REGRESO,
      code_verifier: pkce.verificador,
    })
  } catch (error) {
    console.warn('No se pudo completar el inicio de sesión:', error.message)
  } finally {
    // Se quita /sesion?code=... de la dirección: un código ya usado no sirve.
    window.history.replaceState(null, '', volverA)
  }
}

// --- Tokens (solo cuando el módulo corre solo) ---------------------------------------------------

let temporizador = null

async function pedirTokens(campos) {
  const respuesta = await fetch(`${EMISOR}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENTE, ...campos }),
  })
  if (!respuesta.ok) throw new Error(`Keycloak respondió ${respuesta.status}`)
  const datos = await respuesta.json()
  const nueva = { token: datos.access_token, renovacion: datos.refresh_token, idToken: datos.id_token }
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(nueva))
  aplicar(nueva)
}

async function renovar(renovacion) {
  try {
    await pedirTokens({ grant_type: 'refresh_token', refresh_token: renovacion })
  } catch {
    olvidar()
  }
}

function aplicar({ token, renovacion }) {
  const usuario = leerToken(token)
  estado.token = token
  estado.usuario = { id: usuario.id, usuario: usuario.usuario, nombre: usuario.nombre, roles: usuario.roles }

  // El token dura 5 minutos: se renueva 30 segundos antes de que venza.
  clearTimeout(temporizador)
  const espera = Math.max(usuario.vence - Date.now() - 30_000, 5_000)
  temporizador = setTimeout(() => renovar(renovacion), espera)
}

function olvidar() {
  clearTimeout(temporizador)
  sessionStorage.removeItem(CLAVE_SESION)
  estado.token = null
  estado.usuario = null
}

function leerGuardada() {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null')
  } catch {
    return null
  }
}
