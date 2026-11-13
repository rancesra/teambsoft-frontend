import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const simulados = vi.hoisted(() => ({
  sesion: { token: null, usuario: null },
  iniciarSesion: vi.fn(),
}))
vi.mock('@/utilidades/sesion', () => ({ sesion: simulados.sesion, iniciarSesion: simulados.iniciarSesion }))
vi.mock('@/utilidades/hostApp', () => ({ estaEmbebido: () => true }))

import AccesoAdmin from '@/componentes/AccesoAdmin.vue'

const montar = () => mount(AccesoAdmin, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } })

describe('AccesoAdmin', () => {
  it('sin sesión ofrece iniciarla, y el botón se lo pide al Host App', async () => {
    simulados.sesion.usuario = null
    const vista = montar()

    expect(vista.text()).toContain('Inicia sesión para administrar el catálogo')
    await vista.find('button').trigger('click')
    expect(simulados.iniciarSesion).toHaveBeenCalled()
  })

  it('con una sesión sin rol admin explica por qué no puede entrar, sin botón de login', () => {
    simulados.sesion.usuario = { nombre: 'Carlos Cliente', roles: ['cliente'] }
    const vista = montar()

    expect(vista.text()).toContain('solo para administradores')
    expect(vista.text()).toContain('Carlos Cliente')
    expect(vista.find('button').exists()).toBe(false)
  })
})
