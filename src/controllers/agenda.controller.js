import { enviarOk, enviarError } from '../utils/respuesta.js';
import { crearAgenda, ErrorServicio } from '../services/agenda.service.js';

export async function crear(req, res) {
  try {
    const datos = await crearAgenda(req.body);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al crear la agenda');
  }
}
