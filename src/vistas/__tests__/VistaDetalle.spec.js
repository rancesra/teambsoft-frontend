import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import VistaDetalle from '../VistaDetalle.vue'
import { estaEmbebido, pedirNavegacion } from '@/utilidades/hostApp'

// Simula el Host App: cada prueba decide si el módulo está dentro de un iframe, y se registra lo que
// el módulo le pide al cascarón sin enviar mensajes de verdad.
vi.mock('@/utilidades/hostApp', () => ({
  estaEmbebido: vi.fn(() => false),
  pedirNavegacion: vi.fn(),
}))

beforeEach(() => {
  estaEmbebido.mockReturnValue(false)
})

function respuesta(cuerpo, estado = 200) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  }
}

function simularBackend(rutas) {
  const falso = vi.fn(async (url) => {
    const direccion = String(url)
    for (const [fragmento, respuestaFalsa] of Object.entries(rutas)) {
      if (direccion.includes(fragmento)) {
        return typeof respuestaFalsa === 'function' ? respuestaFalsa(direccion) : respuestaFalsa
      }
    }
    throw new Error('La prueba no esperaba esta petición: ' + direccion)
  })
  vi.stubGlobal('fetch', falso)
  return falso
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function crearRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/catalogo', component: { template: '<div>Listado simulado</div>' } },
      { path: '/catalogo/:id', component: VistaDetalle, props: true }
    ],
  })
}

async function montarEn(ruta) {
  const router = crearRouter()
  await router.push(ruta)
  await router.isReady()

  // Extraemos el id de la ruta (ej: de '/catalogo/p1' sacamos 'p1')
  const idProp = ruta.split('/').pop()

  const envoltura = mount(VistaDetalle, {
    global: { plugins: [router] },
    props: { id: idProp } // ¡Aquí le pasamos la prop obligatoria!
  })
  await flushPromises()
  return { envoltura, router }
}

const categorias = [{ id: 'cat-ropa', nombre: 'ropa' }]

function producto(cambios = {}) {
  return {
    id: 'p1', nombre: 'Camiseta basica', descripcion: 'Algodon', precio: 49900,
    categoria: 'cat-ropa', stock: 50, imagenes: [], activo: true, ...cambios,
  }
}

describe('VistaDetalle', () => {
  it('1. muestra los datos de un producto activo', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto()),
    })
    const { envoltura } = await montarEn('/catalogo/p1')
    
    expect(envoltura.text()).toContain('Camiseta basica')
    expect(envoltura.text()).toMatch(/49\.900/)
    expect(envoltura.text()).toContain('ropa')
  })

  it('2. advierte si el producto está retirado (200 con activo: false), sin botón del carro', async () => {
    estaEmbebido.mockReturnValue(true)
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto({ activo: false })),
    })
    const { envoltura } = await montarEn('/catalogo/p1')

    expect(envoltura.text()).toContain('Producto no disponible')
    expect(envoltura.text()).not.toContain('Agregar al carro')
    expect(envoltura.text()).not.toContain('Este producto no existe')
  })

  it('3. muestra error de id inexistente si el backend responde 404', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/zzz': respuesta({ codigo: 'PRODUCTO_NO_ENCONTRADO' }, 404),
    })
    const { envoltura } = await montarEn('/catalogo/zzz')
    
    expect(envoltura.text()).toContain('Este producto no existe o fue retirado')
  })

  it('4. sin conexión muestra mensaje de error y botón reintentar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const { envoltura } = await montarEn('/catalogo/p1')
    
    expect(envoltura.text()).toContain('No se pudo conectar')
    expect(envoltura.text()).toContain('Reintentar')
  })

  it('5. el botón reintentar vuelve a pedir los datos', async () => {
    const falso = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', falso)
    const { envoltura } = await montarEn('/catalogo/p1')
    
    falso.mockClear()
    const botonReintentar = envoltura.findAll('button').find(b => b.text().includes('Reintentar'))
    await botonReintentar.trigger('click')
    await flushPromises()
    
    expect(falso).toHaveBeenCalled()
  })

  it('6. renderiza miniaturas cuando hay varias imágenes', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto({ imagenes: ['img1.jpg', 'img2.jpg', 'img3.jpg'] })),
    })
    const { envoltura } = await montarEn('/catalogo/p1')
    
    const miniaturas = envoltura.findAll('.miniatura')
    expect(miniaturas.length).toBe(3)
  })

  it('7. muestra texto de reemplazo cuando no hay imágenes', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto({ imagenes: [] })),
    })
    const { envoltura } = await montarEn('/catalogo/p1')
    
    expect(envoltura.text()).toContain('sin imagen')
  })

  // ---- Botón "Agregar al carro" (contrato del Host App v1.2, sección 9.1) ----

  it('8. dentro del Host App, con producto activo y con stock, muestra el botón del carro', async () => {
    estaEmbebido.mockReturnValue(true)
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto()),
    })
    const { envoltura } = await montarEn('/catalogo/p1')

    expect(envoltura.find('.boton-carro').exists()).toBe(true)
  })

  it('9. al pulsarlo le pide al Host App navegar a /carrito?agregar={id}', async () => {
    estaEmbebido.mockReturnValue(true)
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto()),
    })
    const { envoltura } = await montarEn('/catalogo/p1')

    await envoltura.find('.boton-carro').trigger('click')

    expect(pedirNavegacion).toHaveBeenCalledTimes(1)
    expect(pedirNavegacion).toHaveBeenCalledWith('/carrito?agregar=p1')
  })

  it('10. corriendo solo, sin el Host App, no muestra el botón', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto()),
    })
    const { envoltura } = await montarEn('/catalogo/p1')

    expect(envoltura.find('.boton-carro').exists()).toBe(false)
  })

  it('11. sin stock no muestra el botón, aunque esté dentro del Host App', async () => {
    estaEmbebido.mockReturnValue(true)
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto({ stock: 0 })),
    })
    const { envoltura } = await montarEn('/catalogo/p1')

    expect(envoltura.text()).toContain('Sin stock')
    expect(envoltura.find('.boton-carro').exists()).toBe(false)
  })
})
