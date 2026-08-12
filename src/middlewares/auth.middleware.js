import jwt from 'jsonwebtoken';
import { enviarError } from '../utils/respuesta.js';

export function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return enviarError(res, 401, 'Token no provisto');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, rol, id_sede }
    next();
  } catch (error) {
    return enviarError(res, 401, 'Token invalido o vencido');
  }
}

export function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return enviarError(res, 401, 'No autenticado');
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return enviarError(res, 403, 'No tiene permisos para acceder a este recurso');
    }
    next();
  };
}
