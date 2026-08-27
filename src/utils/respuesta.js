// Formato uniforme de respuesta para toda la API: { codigo, estado, mensaje, datos }

/**
 * @param {import('express').Response} res
 * @param {number} codigo
 * @param {unknown} [datos]
 * @param {string} [mensaje]
 */
export function enviarOk(res, codigo, datos = null, mensaje = null) {
  return res.status(codigo).json({ codigo, estado: 'ok', mensaje, datos });
}

/**
 * @param {import('express').Response} res
 * @param {number} codigo
 * @param {string} mensaje
 * @param {unknown} [datos]
 */
export function enviarError(res, codigo, mensaje, datos = null) {
  return res.status(codigo).json({ codigo, estado: 'error', mensaje, datos });
}

