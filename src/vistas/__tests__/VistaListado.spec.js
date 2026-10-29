import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, it, vi, afterEach } from 'vitest'
import VistaListado from '../VistaListado.vue'

/** Respuesta falsa con la forma mínima que usa un cliente de fetch. */
function respuesta(cuerpo, estado = 200) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  }
}

/** Simula el backend interceptando fetch */
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
      { path: '/catalogo', component: VistaListado },
      { path: '/catalogo/:id', component: { template: '<div>Detalle simulado</div>' } },
    ],
  })
}

async function montarEn(ruta, vista) {
  const router = crearRouter()
  await router.push(ruta)
  await router.isReady()
  const envoltura = mount(vista, { global: { plugins: [router] } })
  await flushPromises()
  return { envoltura, router }
}

const categorias = [
  { id: 'cat-ropa', nombre: 'ropa' },
  { id: 'cat-hogar', nombre: 'hogar' },
]

function producto(cambios = {}) {
  return {
    id: 'p1', nombre: 'Camiseta basica', descripcion: 'Algodon', precio: 49900,
    categoria: 'cat-ropa', stock: 50, imagenes: [], activo: true, ...cambios,
  }
}

function pagina(productos, extra = {}) {
  return { productos, total: productos.length, pagina: 1, tamanoPagina: 20, ...extra }
}

describe('VistaListado', () => {
  it('pide la página 1 por defecto (el contrato arranca en 1, no en 0)', async () => {
    const falso = simularBackend({
      '/categorias': respuesta(categorias),
      '/productos': respuesta(pagina([producto()])),
    })

    await montarEn('/catalogo', VistaListado)

    const peticionDeProductos = falso.mock.calls
      .map(([url]) => String(url))
      .find((url) => url.includes('/productos'))
    expect(peticionDeProductos).toContain('pagina=1')
    expect(peticionDeProductos).not.toContain('pagina=0')
  })

  it('una lista vacía muestra el estado vacío y no un error', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos': respuesta(pagina([], { total: 0 })),
    })

    const { envoltura } = await montarEn('/catalogo?categoria=cat-hogar', VistaListado)

    expect(envoltura.text()).toContain('No hay productos en esta categoría.')
    expect(envoltura.text()).not.toContain('No se pudo conectar')
  })

  it('renderiza los productos devueltos por el backend', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos': respuesta(pagina([
        producto(),
        producto({ id: 'p2', nombre: 'Taza de ceramica', categoria: 'cat-hogar' }),
      ])),
    })

    const { envoltura } = await montarEn('/catalogo', VistaListado)

    expect(envoltura.text()).toContain('Camiseta basica')
    expect(envoltura.text()).toContain('Taza de ceramica')
  })

  it('lee el filtro y la página desde la URL', async () => {
    const falso = simularBackend({
      '/categorias': respuesta(categorias),
      '/productos': respuesta(pagina([producto()])),
    })

    await montarEn('/catalogo?categoria=cat-hogar&pagina=3', VistaListado)

    const peticionDeProductos = falso.mock.calls
      .map(([url]) => String(url))
      .find((url) => url.includes('/productos'))
    expect(peticionDeProductos).toContain('categoria=cat-hogar')
    expect(peticionDeProductos).toContain('pagina=3')
  })

  it('muestra el nombre de la categoría del producto', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos': respuesta(pagina([producto()])),
    })

    const { envoltura } = await montarEn('/catalogo', VistaListado)

    expect(envoltura.find('.categoria').text()).toBe('ropa')
  })

  it('redirige a la página 1 al cambiar de categoría', async () => {
    const falso = simularBackend({
      '/categorias': respuesta(categorias),
      '/productos': respuesta(pagina([producto()])),
    })

    const { envoltura, router } = await montarEn(
      '/catalogo?categoria=cat-ropa&pagina=3',
      VistaListado,
    )

    const botonHogar = envoltura.findAll('button.chip')
      .find((boton) => boton.text() === 'hogar')
    await botonHogar.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query.categoria).toBe('cat-hogar')
    expect(router.currentRoute.value.query.pagina).toBeUndefined()
    const peticionTrasCambiarCategoria = falso.mock.calls
      .map(([url]) => String(url))
      .filter((url) => url.includes('/productos'))
      .pop()
    expect(peticionTrasCambiarCategoria).toContain('pagina=1')
  })

  it('muestra un mensaje de error cuando falla la conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin conexión')))

    const { envoltura } = await montarEn('/catalogo', VistaListado)

    expect(envoltura.get('[role="alert"]').text()).toContain(
      'No se pudo conectar con el servidor.',
    )
  })

  it('realiza una nueva petición al pulsar Reintentar', async () => {
    const peticionDeProductos = vi.fn()
      .mockRejectedValueOnce(new Error('sin conexión'))
      .mockResolvedValueOnce(respuesta(pagina([producto()])))
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('/categorias')) return respuesta(categorias)
      if (String(url).includes('/productos')) return peticionDeProductos()
      throw new Error('La prueba no esperaba esta petición: ' + url)
    }))

    const { envoltura } = await montarEn('/catalogo', VistaListado)

    expect(envoltura.get('[role="alert"]').text()).toContain(
      'No se pudo conectar con el servidor.',
    )
    const botonReintentar = envoltura.findAll('button')
      .find((boton) => boton.text() === 'Reintentar')
    await botonReintentar.trigger('click')
    await flushPromises()

    expect(peticionDeProductos).toHaveBeenCalledTimes(2)
    expect(envoltura.text()).toContain('Camiseta basica')
    expect(envoltura.find('[role="alert"]').exists()).toBe(false)
  })

  it('oculta el paginador cuando solo hay una página', async () => {
    simularBackend({
      '/categorias': respuesta(categorias),
      '/productos': respuesta(pagina([producto()], { total: 1 })),
    })

    const { envoltura } = await montarEn('/catalogo', VistaListado)

    expect(envoltura.find('nav[aria-label="Paginación"]').exists()).toBe(false)
  })
})