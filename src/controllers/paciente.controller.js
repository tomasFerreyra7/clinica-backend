import { enviarOk, enviarError } from '../utils/respuesta.js';
import { buscarPacientes as buscarPacientesService, ErrorServicio } from '../services/paciente.service.js';

export async function buscarPacientes(req, res) {
  try {
    const datos = await buscarPacientesService(req.query);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al buscar pacientes');
  }
}
