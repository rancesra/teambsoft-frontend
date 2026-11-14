import { afterEach, describe, expect, it, vi } from 'vitest'

// La sesión se simula: aquí solo importa qué hace el cliente cuando hay token y cuando no.
const sesionSimulada = vi.hoisted(() => ({ token: null, usuario: null }))
vi.mock('@/utilidades/sesion', () => ({ sesion: sesionSimulada }))

import { api } from '@/api/cliente'

function simularFetch() {
  const fetchSimulado = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  vi.stubGlobal('fetch', fetchSimulado)
  return fetchSimulado
}

describe('el token en las peticiones', () => {
  afterEach(() => {
    sesionSimulada.token = null
    vi.unstubAllGlobals()
  })

  it('sin sesión no envía la cabecera Authorization', async () => {
    const fetchSimulado = simularFetch()

    await api.get('/productos')

    expect(fetchSimulado.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it('con sesión envía el token como Bearer, también junto al cuerpo JSON', async () => {
    sesionSimulada.token = 'token-de-prueba'
    const fetchSimulado = simularFetch()

    await api.post('/productos', { nombre: 'Camiseta' })

    expect(fetchSimulado.mock.calls[0][1].headers).toEqual({
      Authorization: 'Bearer token-de-prueba',
      'Content-Type': 'application/json',
    })
  })
})
