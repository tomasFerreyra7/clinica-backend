import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  listarAuditoria,
  ErrorServicio,
} from '../services/auditoria.service.js';

export async function listar(req, res) {
  try {
    const datos = await listarAuditoria(req.query);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }

    console.error(error);
    return enviarError(res, 500, 'Error al obtener los logs de auditoria');
  }
}
