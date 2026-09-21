# 🛍️ Tienda Virtual — Frontend del Catálogo

![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?logo=vuedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?logo=nodedotjs&logoColor=white)

**Equipo B** · Ingeniería de Software II · Universidad Industrial de Santander (UIS)

Módulo de frontend del Catálogo: las vistas para listar, consultar, crear, editar y desactivar productos. Consume la API del microservicio de Catálogo a través de Kong. No guarda datos propios ni define reglas: las reglas están en el contrato.

## Los dos repositorios

| Repositorio | Qué contiene | Quién trabaja ahí |
|---|---|---|
| [teambsoft-backend](https://github.com/rancesra/teambsoft-backend) | El microservicio en Spring Boot y la documentación del módulo | B1 a B4 |
| **teambsoft-frontend** (este) | El módulo de frontend en Vue.js | F1 a F3 |

La documentación del módulo vive **en el repositorio del backend**, para que no existan dos versiones distintas de un mismo acuerdo. Desde aquí se enlaza.

## Documentación

**¿Vas a empezar?** Lee en este orden: [guía de inicio](GUIA-INICIO.md) → [plan de trabajo](https://github.com/rancesra/teambsoft-backend/blob/main/PLAN-DE-TRABAJO.md) → [guía de git](GUIA-GIT.md).

| Documento | Para qué te sirve |
|---|---|
| [Contrato de servicio (v2.2)](https://github.com/rancesra/teambsoft-backend/blob/main/docs/CONTRATO-CATALOGO.md) | **El más importante.** Qué endpoints hay, qué devuelven, qué validaciones aplican y cómo llegan los errores |
| [Historias de usuario](https://github.com/rancesra/teambsoft-backend/blob/main/docs/HISTORIAS.md) | Qué debe poder hacer el usuario y con qué criterios se acepta cada historia |
| [Plan de trabajo](https://github.com/rancesra/teambsoft-backend/blob/main/PLAN-DE-TRABAJO.md) | Tu tarea (F1, F2 o F3), de qué depende y cómo verificar que terminó |
| [Arquitectura](https://github.com/rancesra/teambsoft-backend/blob/main/docs/ARQUITECTURA-CATALOGO.md) | Dónde encaja este módulo dentro del sistema |
| [Propuesta visual](docs/propuesta-visual-catalogo.html) | **Cómo se ve.** Las pantallas con su acabado final y las once variables de estilo que proponemos a los 3 equipos |
| [Mockup del módulo en el Host App](docs/mockup-catalogo-hostapp.html) | **Qué lleva y por qué.** Las pantallas con las reglas del contrato anotadas, los espacios reservados para Búsqueda y Carro, el mapa de rutas y las 6 historias |
| [Mockup de las vistas](docs/mockup-frontend-catalogo.html) | Las tres vistas dibujadas, con las reglas del contrato anotadas en cada pantalla. Ábrelo en el navegador desde tu copia del repo (doble clic). Es una copia del original, que vive en el repositorio del backend: si hay que cambiarlo, se cambia allá primero |

## La API que consume

Todas las rutas pasan por Kong con el prefijo `/api/catalogo` (contrato §2), así que la URL base va en una variable de entorno y nunca escrita a mano en los componentes.

| Vista | Llamada | Respuesta |
|---|---|---|
| Listado | `GET /productos?categoria=&pagina=&tamanoPagina=` | 200 con la página de productos activos |
| Detalle | `GET /productos/{id}` | 200 · 404 `PRODUCTO_NO_ENCONTRADO` |
| Selector de categoría | `GET /categorias` | 200 con la lista de categorías |
| Crear | `POST /productos` | 201 · 400 `VALIDACION_FALLIDA` |
| Editar | `PUT /productos/{id}` | 200 · 404 · 400 |
| Desactivar | `DELETE /productos/{id}` | 204 |

Tres reglas del contrato que se notan en la interfaz:

- **La paginación empieza en la página 1**, no en 0. `tamanoPagina` va de 1 a 100 y por defecto es 20.
- **Los errores llegan siempre como `{ "codigo": "...", "mensaje": "..." }`.** La interfaz reacciona al `codigo`, no al texto del mensaje.
- **`PUT` reemplaza el producto completo:** el formulario de edición carga todos los campos y los envía todos, no solo el que cambió.

## Cómo ejecutar

> El proyecto de Vue todavía no existe: lo crea **F1** (ver el plan de trabajo). Cuando su pull request entre a `main`, estos son los comandos.

```bash
npm install     # instala las dependencias (la primera vez y cada vez que cambien)
npm run dev     # arranca el servidor de desarrollo en http://localhost:5173
npm run build   # compila para producción; sirve para comprobar que todo compila
```

En Windows (PowerShell) son los mismos comandos.

**Requisito:** Node.js en versión LTS. La instalación paso a paso está en la [guía de inicio](GUIA-INICIO.md).

## Estado — Segunda entrega

- [ ] F1 — Base del frontend (proyecto Vue, rutas, cliente HTTP, manejo de errores)
- [ ] F2 — Vistas de lectura (listado y detalle)
- [ ] F3 — Vistas de administración (crear, editar y desactivar)
- [ ] Integración con el backend a través de Kong

## Equipo — frente de frontend

| Integrante | Tarea |
|---|---|
| Juan Diego Tellez Quintero | F1 — Base del frontend |
| Roger Sergio Hernandez | F2 — Vistas de lectura |
| Carlos Andrés Beltrán Ardila | F3 — Vistas de administración |

El frente de backend (Rances Ramírez, Hector Franco, Jhon Velandia y Cristian Rivera) trabaja en [teambsoft-backend](https://github.com/rancesra/teambsoft-backend).
