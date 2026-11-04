import { enviarOk, enviarError } from '../utils/respuesta.js';
import { listarMedicos as listarMedicosService, ErrorServicio } from '../services/medico.service.js';

export async function listarMedicos(req, res) {
  try {
    const datos = await listarMedicosService(req.query);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener medicos');
  }
}
