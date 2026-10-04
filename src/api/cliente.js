// Única puerta hacia el backend. Ninguna vista usa fetch directamente: así, cuando cambie algo del
// contrato, se cambia en un solo archivo. Traduce los errores al formato {codigo, mensaje} del
// contrato y agrega SIN_CONEXION, que no viene del backend sino de que no hubo respuesta.

const BASE = import.meta.env.VITE_API_URL ?? '/api/catalogo'

export class ErrorApi extends Error {
  constructor({ estado, codigo, mensaje }) {
    super(mensaje)
    this.estado = estado
    this.codigo = codigo
  }
}

const sinConexion = () =>
  new ErrorApi({
    estado: 0,
    codigo: 'SIN_CONEXION',
    mensaje: 'No se pudo conectar con el servidor',
  })

async function pedir(metodo, ruta, cuerpo) {
  // El cuerpo solo se agrega cuando hay uno: un GET con "body", aunque vaya vacío, es inválido.
  const opciones = { method: metodo, headers: {} }
  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json'
    opciones.body = JSON.stringify(cuerpo)
  }

  let respuesta
  try {
    respuesta = await fetch(`${BASE}${ruta}`, opciones)
  } catch {
    // fetch solo falla así cuando no hubo respuesta: servidor apagado o sin red.
    throw sinConexion()
  }

  // 204 (DELETE) no trae cuerpo: intentar leerlo como JSON reventaría.
  if (respuesta.status === 204) return null

  const datos = await respuesta.json().catch(() => null)
  if (respuesta.ok) return datos

  // Si el backend está apagado, el proxy de Vite responde 500 sin JSON.
  if (respuesta.status >= 500 && datos === null) throw sinConexion()

  throw new ErrorApi({
    estado: respuesta.status,
    codigo: datos?.codigo ?? 'ERROR_INESPERADO',
    mensaje: datos?.mensaje ?? 'Algo salió mal. Intenta de nuevo',
  })
}

export const api = {
  get: (ruta) => pedir('GET', ruta),
  post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
  put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
  borrar: (ruta) => pedir('DELETE', ruta),
}