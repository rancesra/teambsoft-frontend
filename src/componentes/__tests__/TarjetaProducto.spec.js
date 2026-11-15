import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TarjetaProducto from '../TarjetaProducto.vue'
import { estaEmbebido, pedirNavegacion } from '@/utilidades/hostApp'

// Simula el Host App: cada prueba decide si la tarjeta está dentro del iframe, y se registra lo que
// le pide al cascarón sin enviar mensajes de verdad.
vi.mock('@/utilidades/hostApp', () => ({
  estaEmbebido: vi.fn(() => false),
  pedirNavegacion: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  estaEmbebido.mockReturnValue(false)
})

const categorias = [{ id: 'cat-ropa', nombre: 'ropa' }]

const base = {
  id: 'p1',
  nombre: 'Camiseta basica',
  precio: 49900,
  categoria: 'cat-ropa',
  stock: 50,
  imagenes: [],
  activo: true,
}

function montar(cambios = {}) {
  return mount(TarjetaProducto, {
    props: { producto: { ...base, ...cambios }, categorias },
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  })
}

describe('TarjetaProducto', () => {
  it('muestra el nombre de la categoría y no su id', () => {
    const texto = montar().text()
    expect(texto).toContain('ropa')
    expect(texto).not.toContain('cat-ropa')
  })

  it('enlaza al detalle del producto', () => {
    expect(montar().find('a').attributes('href')).toBe('/catalogo/p1')
  })

  it('muestra «sin imagen» cuando no hay imágenes', () => {
    expect(montar({ imagenes: [] }).text()).toContain('sin imagen')
  })

  it.each([
    [0, 'sin', 'Sin stock'],
    [5, 'poco', 'Quedan 5'],
    [10, 'poco', 'Quedan 10'],
    [11, 'hay', '11 disponibles'],
  ])('con stock %i usa la variante «%s»', (stock, clase, texto) => {
    const etiqueta = montar({ stock }).find('.stock')
    expect(etiqueta.classes()).toContain(clase)
    expect(etiqueta.text()).toBe(texto)
  })

  describe('botón «Agregar al carro» (contrato v2.8, sección 9)', () => {
    it('dentro del Host App, con un producto activo y con stock, aparece', () => {
      estaEmbebido.mockReturnValue(true)
      expect(montar().find('button.agregar').exists()).toBe(true)
    })

    it('al pulsarlo le pide al Host App abrir Carrito con ?agregar={id}', async () => {
      estaEmbebido.mockReturnValue(true)
      await montar({ id: 'p 1' }).find('button.agregar').trigger('click')
      expect(pedirNavegacion).toHaveBeenCalledWith('/carrito?agregar=p%201')
    })

    it.each([
      ['fuera del Host App', false, {}],
      ['sin stock', true, { stock: 0 }],
      ['con el producto retirado', true, { activo: false }],
    ])('no aparece %s', (_caso, embebido, cambios) => {
      estaEmbebido.mockReturnValue(embebido)
      expect(montar(cambios).find('button.agregar').exists()).toBe(false)
    })

    it('el botón queda fuera del enlace al detalle', () => {
      estaEmbebido.mockReturnValue(true)
      expect(montar().find('a button').exists()).toBe(false)
    })
  })
})
