// Formato uniforme de respuesta para toda la API: { codigo, estado, datos }

export function enviarOk(res, codigo, datos = null, estado = 'ok') {
  return res.status(codigo).json({ codigo, estado, datos });
}

export function enviarError(res, codigo, mensaje, datos = null) {
  return res.status(codigo).json({ codigo, estado: mensaje, datos });
}
