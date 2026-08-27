import { enviarOk, enviarError } from '../utils/respuesta.js';
import { listarNotificaciones, marcarNotificacionLeida, ErrorServicio } from '../services/notificacion.service.js';

export async function listar(req, res) {
  try {
    const datos = await listarNotificaciones(req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener las notificaciones');
  }
}

export async function marcarLeida(req, res) {
  try {
    const datos = await marcarNotificacionLeida(req.params.id, req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al marcar la notificacion como leida');
  }
}

