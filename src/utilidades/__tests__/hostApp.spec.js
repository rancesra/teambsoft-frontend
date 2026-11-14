import { afterEach, describe, expect, it, vi } from 'vitest'

import { estaEmbebido, pedirNavegacion } from '../hostApp'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('hostApp', () => {
  it('1. corriendo solo (la ventana es la de más arriba) no está embebido', () => {
    expect(estaEmbebido()).toBe(false)
  })

  it('2. pedirNavegacion le manda al cascarón el mensaje navegar del contrato', () => {
    const enviar = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {})

    pedirNavegacion('/carrito?agregar=674000000000000000000001')

    expect(enviar).toHaveBeenCalledWith({ tipo: 'navegar', ruta: '/carrito?agregar=674000000000000000000001' }, '*')
  })
})
