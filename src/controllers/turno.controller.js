import { enviarOk, enviarError } from '../utils/respuesta.js';
import { crearTurno, cancelarTurno, ErrorServicio } from '../services/turno.service.js';

export async function crear(req, res) {
  try {
    const datos = await crearTurno(req.body, req.usuario);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al crear el turno');
  }
}

export async function cancelar(req, res) {
  try {
    const datos = await cancelarTurno(req.params.id, req.usuario);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al cancelar el turno');
  }
}
