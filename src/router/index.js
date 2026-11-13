import { createRouter, createWebHistory } from 'vue-router'

// Las rutas con meta.soloAdmin piden el rol admin: App.vue muestra un aviso en vez de la vista si el
// usuario no lo tiene. El backend igual lo exige (contrato v2.5); esto solo evita una pantalla que
// fallaría en cada botón.
//
// Las rutas se declaran relativas a /catalogo porque este módulo se monta dentro del Host App bajo
// ese prefijo (contrato del Host App, sección 2). Si el prefijo cambiara, solo cambia esta constante.
const rutas = [
  { path: '/', redirect: '/catalogo' },
  {
    path: '/catalogo',
    name: 'catalogo-listado',
    component: () => import('@/vistas/VistaListado.vue'),
  },
  {
    path: '/catalogo/admin',
    name: 'catalogo-admin',
    meta: { soloAdmin: true },
    component: () => import('@/vistas/VistaAdmin.vue'),
  },
  {
    path: '/catalogo/admin/nuevo',
    name: 'catalogo-nuevo',
    meta: { soloAdmin: true },
    component: () => import('@/vistas/VistaFormulario.vue'),
  },
  {
    path: '/catalogo/admin/:id',
    name: 'catalogo-editar',
    meta: { soloAdmin: true },
    component: () => import('@/vistas/VistaFormulario.vue'),
    props: true,
  },
  {
    // Va de última: /catalogo/admin es más específica y debe ganar sobre /catalogo/:id.
    path: '/catalogo/:id',
    name: 'catalogo-detalle',
    component: () => import('@/vistas/VistaDetalle.vue'),
    props: true,
  },
  { path: '/:rutaInvalida(.*)', component: () => import('@/vistas/VistaNoEncontrada.vue') },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: rutas,
})