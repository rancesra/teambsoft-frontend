import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import VistaAdmin from '../VistaAdmin.vue'

function respuesta(cuerpo, estado = 200) {
  return { ok: estado >= 200 && estado < 300, status: estado, json: async () => cuerpo }
}

// 230 productos activos de mentira: tres páginas de 100 (100, 100 y 30). Dos de ellos son lámparas,
// una en la segunda página, para comprobar que la búsqueda recorre todas las páginas.
const PRODUCTOS = Array.from({ length: 230 }, (_, i) => ({
  id: `p${i}`,
  nombre: i === 3 ? 'Lámpara de escritorio LED' : i === 150 ? 'Lampara de pie' : `Producto ${i}`,
  precio: 1000,
  categoria: 'cat-hogar',
  stock: 5,
  activo: true,
}))

function simularBackend() {
  const falso = vi.fn(async (url) => {
    const direccion = new URL(String(url), 'http://local')
    if (direccion.pathname.endsWith('/categorias')) {
      return respuesta([{ id: 'cat-hogar', nombre: 'hogar' }])
    }
    if (direccion.pathname.endsWith('/productos')) {
      const pagina = Number(direccion.searchParams.get('pagina'))
      const tamano = Number(direccion.searchParams.get('tamanoPagina'))
      const desde = (pagina - 1) * tamano
      return respuesta({
        productos: PRODUCTOS.slice(desde, desde + tamano),
        total: PRODUCTOS.length,
        pagina,
        tamanoPagina: tamano,
      })
    }
    throw new Error('La prueba no esperaba esta petición: ' + url)
  })
  vi.stubGlobal('fetch', falso)
  return falso
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.useRealTimers()
})

async function montarEn(ruta) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/catalogo/admin', component: VistaAdmin },
      { path: '/catalogo/admin/:id', component: { template: '<div />' } },
    ],
  })
  await router.push(ruta)
  await router.isReady()
  const envoltorio = mount(VistaAdmin, { global: { plugins: [router] } })
  await flushPromises()
  return { envoltorio, router }
}

const filas = (envoltorio) => envoltorio.findAll('tbody tr').map((f) => f.find('strong').text())

describe('VistaAdmin: buscar por nombre', () => {
  it('sin búsqueda pide una sola página de 20, como siempre', async () => {
    const fetch = simularBackend()
    const { envoltorio } = await montarEn('/catalogo/admin')

    expect(filas(envoltorio)).toHaveLength(20)
    expect(envoltorio.text()).toContain('230 en total')
    const pedidos = fetch.mock.calls.map(([url]) => String(url)).filter((u) => u.includes('/productos'))
    expect(pedidos).toHaveLength(1)
    expect(pedidos[0]).toContain('tamanoPagina=20')
  })

  it('con búsqueda recorre todas las páginas y encuentra sin importar tildes ni mayúsculas', async () => {
    const fetch = simularBackend()
    const { envoltorio } = await montarEn('/catalogo/admin?buscar=LAMPARA')

    expect(filas(envoltorio)).toEqual(['Lámpara de escritorio LED', 'Lampara de pie'])
    expect(envoltorio.text()).toContain('2 encontrados')
    const pedidos = fetch.mock.calls.map(([url]) => String(url)).filter((u) => u.includes('/productos'))
    expect(pedidos).toHaveLength(3)
    expect(pedidos.every((u) => u.includes('tamanoPagina=100') && u.includes('activo=true'))).toBe(true)
  })

  it('al escribir en el campo, la búsqueda pasa a la URL y vuelve a la página 1', async () => {
    simularBackend()
    vi.useFakeTimers()
    const { envoltorio, router } = await montarEn('/catalogo/admin?pagina=3')

    await envoltorio.find('input.buscador').setValue('lampara')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ buscar: 'lampara' })
    expect(filas(envoltorio)).toHaveLength(2)
  })

  it('si nada coincide lo dice, y ofrece quitar la búsqueda', async () => {
    simularBackend()
    const { envoltorio } = await montarEn('/catalogo/admin?buscar=bicicleta')

    expect(envoltorio.text()).toContain('Ningún producto se llama como «bicicleta»')
    expect(envoltorio.text()).toContain('Quitar la búsqueda')
  })
})
