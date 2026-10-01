import { createRouter, createWebHistory } from 'vue-router'

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
    component: () => import('@/vistas/VistaAdmin.vue'),
  },
  {
    path: '/catalogo/admin/nuevo',
    name: 'catalogo-nuevo',
    component: () => import('@/vistas/VistaFormulario.vue'),
  },
  {
    path: '/catalogo/admin/:id',
    name: 'catalogo-editar',
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