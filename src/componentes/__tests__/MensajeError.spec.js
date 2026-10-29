import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MensajeError from '../MensajeError.vue'

describe('MensajeError', () => {
  it.each([
    ['SIN_CONEXION', 'No se pudo conectar con el servidor'],
    ['PRODUCTO_NO_ENCONTRADO', 'Este producto no existe o fue retirado del catálogo'],
  ])('para el código %s muestra el mensaje correcto', (codigo, texto) => {
    const envoltura = mount(MensajeError, { props: { error: { codigo, mensaje: 'Ignorado' } } })
    expect(envoltura.text()).toContain(texto)
  })

  it('un código desconocido muestra un mensaje genérico', () => {
    const envoltura = mount(MensajeError, { props: { error: { codigo: 'X', mensaje: 'Fallo' } } })
    expect(envoltura.text()).not.toContain('Fallo')
    expect(envoltura.text().length).toBeGreaterThan(5)
  })
})
