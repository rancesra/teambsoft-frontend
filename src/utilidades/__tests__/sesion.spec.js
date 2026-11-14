import { describe, expect, it } from 'vitest'

import { base64Url, leerToken, retoDe, sesionDelMensaje } from '@/utilidades/sesion'

const HOST = 'http://localhost:5050'
const mensaje = (origin, data) => ({ origin, data })

function tokenDePrueba(datos) {
  const parte = (objeto) => base64Url(new TextEncoder().encode(JSON.stringify(objeto)))
  return `${parte({ alg: 'RS256' })}.${parte(datos)}.firma`
}

describe('sesionDelMensaje (la sesión que manda el Host App)', () => {
  const usuario = { id: 'u-1', usuario: 'admin', nombre: 'Ana', roles: ['admin'] }

  it('acepta la sesión que llega del Host App', () => {
    expect(sesionDelMensaje(mensaje(HOST, { tipo: 'sesion', token: 'abc', usuario }), HOST)).toEqual({
      token: 'abc',
      usuario,
    })
  })

  it('acepta el cierre de sesión: token y usuario en null', () => {
    expect(sesionDelMensaje(mensaje(HOST, { tipo: 'sesion', token: null, usuario }), HOST)).toEqual({
      token: null,
      usuario: null,
    })
  })

  it('ignora una sesión que llega de otra página, aunque tenga la forma correcta', () => {
    expect(sesionDelMensaje(mensaje('http://localhost:6666', { tipo: 'sesion', token: 'abc', usuario }), HOST)).toBeNull()
  })

  it('ignora mensajes de otro tipo, sin datos o con un token que no es texto', () => {
    expect(sesionDelMensaje(mensaje(HOST, { tipo: 'navegar', ruta: '/carrito' }), HOST)).toBeNull()
    expect(sesionDelMensaje(mensaje(HOST, null), HOST)).toBeNull()
    expect(sesionDelMensaje(mensaje(HOST, { tipo: 'sesion', token: 42 }), HOST)).toBeNull()
  })
})

describe('PKCE y lectura del token', () => {
  it('calcula el reto del ejemplo del estándar (RFC 7636, apéndice B)', async () => {
    expect(await retoDe('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    )
  })

  it('lee el nombre con tildes y los roles del realm', () => {
    const leido = leerToken(
      tokenDePrueba({ sub: 'u', name: 'Rancés Ramírez', realm_access: { roles: ['admin'] }, exp: 2 }),
    )
    expect(leido).toMatchObject({ id: 'u', nombre: 'Rancés Ramírez', roles: ['admin'], vence: 2000 })
  })
})
