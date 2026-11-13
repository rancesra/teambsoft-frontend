// Todo lo que el módulo sabe del Host App vive aquí (contrato del Host App v1.2, sección 4).
// Así las vistas no tocan window.parent directamente, y las pruebas pueden simular el iframe.

/**
 * Dentro del Host App, el módulo corre en un iframe: la ventana del módulo no es la de más arriba.
 * Cuando corre solo (npm run dev en este repositorio), las dos son la misma.
 */
export function estaEmbebido() {
  return window.self !== window.top
}

/**
 * Le pide al Host App que lleve al usuario a otra ruta, que puede ser de otro módulo. El módulo no
 * puede hacerlo solo: corre en otro puerto, dentro de un iframe, y no controla la dirección del
 * cascarón. El Host App valida de dónde viene el mensaje y a qué ruta apunta antes de navegar.
 *
 * El destino es '*' porque el módulo no sabe en qué dirección corre el Host App, y el mensaje no
 * lleva nada privado: solo una ruta.
 */
export function pedirNavegacion(ruta) {
  window.parent.postMessage({ tipo: 'navegar', ruta }, '*')
}
