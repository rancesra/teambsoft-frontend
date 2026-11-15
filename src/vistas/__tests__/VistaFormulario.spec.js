import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, it, vi, afterEach } from 'vitest'
import VistaFormulario from '../VistaFormulario.vue'

function respuesta(cuerpo, estado = 200) {
  return {
    ok: estado >= 200 && estado < 300,
    status: estado,
    json: async () => cuerpo,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function montarNuevo() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      if (String(url).includes('/categorias')) {
        return respuesta([
          { id: 'cat-ropa', nombre: 'ropa' },
          { id: 'cat-hogar', nombre: 'hogar' },
        ])
      }
      throw new Error('La prueba no esperaba esta petición: ' + url)
    }),
  )

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/catalogo/admin', component: { template: '<div>Admin simulado</div>' } },
      { path: '/catalogo/admin/nuevo', component: VistaFormulario },
    ],
  })
  await router.push('/catalogo/admin/nuevo')
  await router.isReady()

  const envoltorio = mount(VistaFormulario, { global: { plugins: [router] } })
  await flushPromises()
  return envoltorio
}

describe('VistaFormulario', () => {
  it('debajo de la categoría no muestra notas de desarrollo', async () => {
    const envoltorio = await montarNuevo()

    expect(envoltorio.text()).not.toContain('GET /categorias')
    expect(envoltorio.text()).toContain('Obligatoria')
  })

  it('al elegir la categoría se borra su aviso y los demás se quedan', async () => {
    const envoltorio = await montarNuevo()

    await envoltorio.find('form').trigger('submit')
    expect(envoltorio.text()).toContain('categoría: es obligatoria')
    expect(envoltorio.text()).toContain('nombre: es obligatorio')

    await envoltorio.find('select').setValue('cat-ropa')

    expect(envoltorio.text()).not.toContain('categoría: es obligatoria')
    expect(envoltorio.find('select').classes()).not.toContain('malo')
    expect(envoltorio.text()).toContain('nombre: es obligatorio')
  })

  it('al escribir el nombre se borra su aviso', async () => {
    const envoltorio = await montarNuevo()

    await envoltorio.find('form').trigger('submit')
    expect(envoltorio.text()).toContain('nombre: es obligatorio')

    await envoltorio.find('input').setValue('Gorra')

    expect(envoltorio.text()).not.toContain('nombre: es obligatorio')
  })
})
