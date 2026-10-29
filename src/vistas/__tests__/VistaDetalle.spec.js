import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, it, vi, afterEach } from 'vitest'
import VistaDetalle from '../VistaDetalle.vue'

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
    expect(envoltura.text()).toContain('Espacio reservado')
  })

  it('2. oculta el carro y advierte si el producto está retirado (200 con activo: false)', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos/p1': respuesta(producto({ activo: false })),
    })
    const { envoltura } = await montarEn('/catalogo/p1')
    
    expect(envoltura.text()).toContain('Producto no disponible')
    expect(envoltura.text()).not.toContain('Espacio reservado')
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
})
