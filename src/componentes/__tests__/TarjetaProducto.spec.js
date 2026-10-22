import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TarjetaProducto from '../TarjetaProducto.vue'

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
})
