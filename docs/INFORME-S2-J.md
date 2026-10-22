# Informe S2-J — Estilos, Host App y revisión de F2

**Autor:** Juan Diego Tellez Quintero · **Rama:** `s2-integracion` · **Fecha:** 2026-10-21
**Referencias:** `CONTRATO-HOSTAPP.md` (§4 y §6) · PR #5 (`f2-lectura`)

Entorno de las pruebas: backend en `localhost:8080` (con 28 productos activos y 1 retirado), módulo de Catálogo en `localhost:5173` y Host App en `localhost:5050`.

## 1. S2-J1 — Auditoría de colores a mano

Se buscó con `Select-String` en los `.vue` de `src/`: **21 líneas con color en hexadecimal y 2 con `rgba`**. Ninguna tiene una variable exactamente equivalente en el contrato (§6), así que **no se cambió código**: todo va a decisión de Hector, porque agregar variables cambia el contrato y afecta a los equipos A y C.

| Archivo:línea | Color | Para qué se usa |
|---|---|---|
| `VistaListado.vue:154`, `VistaAdmin.vue:206`, `PaginadorProductos.vue:57` | `#fff` | Texto sobre fondo `--acento` |
| `VistaAdmin.vue:217, 257`, `VistaDetalle.vue:215`, `TarjetaProducto.vue:113` | `#f5f5f4` | Encabezado de tabla y etiqueta «sin stock» |
| `CargandoTarjetas.vue:22` | `#f5f5f4`, `#edebe9` | Degradado del esqueleto de carga |
| `VistaDetalle.vue:129, 255, 261`, `TarjetaProducto.vue:47` | `#f0efed` | Fondo de la foto y de los esqueletos |
| `TarjetaProducto.vue:60`, `VistaDetalle.vue:150` | `#a8a29e` | Texto «sin imagen» |
| `TarjetaProducto.vue:108` | `#fffbeb` | Fondo de la etiqueta «Quedan N» |
| `VistaDetalle.vue:181-182`, `VistaFormulario.vue:247-248` | `#fdf4e6`, `#ebd3a6` | Fondo y borde del aviso de producto retirado |
| `AvisoExito.vue:38` | `#166534` | Texto del mensaje de éxito |
| `MensajeError.vue:33` | `#991b1b` | Texto del mensaje de error |
| `DialogoConfirmar.vue:35, 42` | `rgba(28,25,23,…)` | Sombra y fondo oscuro del diálogo |
| `estilos.css` (`.boton`, `.boton.peligro`) | `#fff`, `#fecaca` | Texto del botón y borde del botón de peligro |

**Variables nuevas propuestas** (a decidir con Hector):

| Variable | Valor | Reemplaza |
|---|---|---|
| `--sobre-acento` | `#ffffff` | `#fff` sobre `--acento` |
| `--superficie-2` | `#f5f5f4` | `#f5f5f4`, `#f0efed`, `#edebe9` (cambio visual mínimo al unificarlos) |
| `--texto-tenue` | `#a8a29e` | `#a8a29e` (alternativa: usar `--texto-suave`, con más contraste) |
| `--aviso-suave` | `#fdf4e6` | `#fdf4e6` y `#fffbeb` |
| `--aviso-borde` | `#ebd3a6` | `#ebd3a6` |
| `--error-borde` | `#fecaca` | `#fecaca` |
| `--sombra-fuerte`, `--velo` | por definir | Sombra y fondo oscuro del diálogo |

**Casi equivalentes (pendiente de confirmar):** `#166534` frente a `--ok` (`#15803d`) y `#991b1b` frente a `--error` (`#b91c1c`). Si Hector aprueba, se reemplazan y se revisa el contraste a ojo.

En el Host App también hay dos colores a mano (`#14b8a6` en `EncabezadoHost.vue` y `#f0efed` en `MarcoModulo.vue`); son del cascarón y se informan a Hector.

## 2. S2-J2 — El módulo dentro del Host App

| Qué se comprueba | Resultado | Nota |
|---|---|---|
| Un solo encabezado | ✅ | Solo se ve el del cascarón; `App.vue` oculta el suyo con `window.self !== window.top` |
| Rutas `/catalogo`, `/catalogo/<id>`, `/catalogo/admin` | ✅ | Cada una abre su vista dentro del cascarón |
| Estilos | ✅ con ⚠ | Las variables de `estilos.css` del módulo y del Host App son **idénticas**. Con iframes (etapa 1) las variables no cruzan al módulo, así que el cambio en caliente de `--acento` solo aplica en la etapa 2 |
| Llamadas por `/api/catalogo` (Kong) | ⏳ | Salen por el proxy de Vite hacia el 8080, no por Kong: B4 todavía no está en `main` |
| Recargar `/catalogo?categoria=cat-hogar&pagina=2` | ✅ | Entrando directo a esa dirección en el cascarón se conserva el filtro y la página |
| Recargar tras filtrar dentro del iframe | ⚠ | Se pierde el filtro: el contrato (§4) dice que la barra de direcciones del cascarón no se actualiza al navegar dentro del módulo. Es una limitación del diseño, no un fallo del módulo |
| Botón «atrás» | ✅ | Vuelve al listado sin salirse del módulo |

## 3. S2-J3 — Revisión de F2 (PR #5, ya unido)

Probado en `localhost:5173` con datos reales:

| Qué se revisa | Resultado |
|---|---|
| La primera página es la 1 (paginador y `?pagina=` arrancan en 1) | ✅ |
| La categoría se muestra con nombre, no con id | ✅ |
| Filtro y página viven en la URL (recargar y «atrás» funcionan) | ✅ |
| Cambiar de categoría vuelve a la página 1 | ✅ |
| Producto retirado: 200 con `activo: false`, aviso amarillo, en gris y sin el recuadro del Carro; no aparece en el listado | ✅ |
| Id inexistente: «Este producto no existe o fue retirado del catálogo.» | ✅ |
| Backend apagado: «No se pudo conectar con el servidor.» y Reintentar | ✅ |
| `npm run build` sin errores | ✅ |
| `git status` sin `node_modules/` ni `dist/` | ✅ |

**Hallazgos** (ninguno rompe el contrato; son mejoras):

1. **`nombreDeCategoria` frente a las pruebas de Carlos.** `src/utilidades/formato.js` devuelve `'...'` si la lista de categorías está vacía y `'Sin categoría'` si no encuentra el id. Las pruebas de la guía de Carlos (S2-C1) esperan que devuelva el propio id. Una de las dos está mal y hay que decidirlo entre Rances y Carlos antes de que la prueba falle. (Hallazgo por lectura de código.)
2. **`?pagina=abc`** produce `NaN`, el backend responde 400 y la pantalla dice «Hay datos incorrectos en el formulario», un texto sin sentido en un listado. Severidad baja. Sugerencia: validar o acotar `pagina` en `VistaListado.vue`.
3. **`?pagina=99`** (mayor que la última) muestra «No hay productos en esta categoría.» sin botón para volver cuando no hay categoría elegida. Severidad baja.
4. Los colores a mano de la sección 1.

## 4. Pendientes

- Hector decide las variables nuevas de la sección 1 y, si las aprueba, se reemplazan en el código y en el contrato (con cambio de versión).
- Probar la fila de Kong cuando los PR de B4 estén en `main`.
- Rances y Carlos resuelven el hallazgo 1 de la sección 3.
