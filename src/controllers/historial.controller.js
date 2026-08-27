import { enviarOk, enviarError } from '../utils/respuesta.js';
import { crearHistorial, listarHistorial, ErrorServicio } from '../services/historial.service.js';

export async function crear(req, res) {
  try {
    const datos = await crearHistorial(req.body, req.usuario);
    return enviarOk(res, 201, datos, 'Historial clinico registrado correctamente');
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al registrar el historial clinico');
  }
}

export async function listar(req, res) {
  try {
    const datos = await listarHistorial(req.usuario);
    return enviarOk(res, 200, datos, 'Historial clinico obtenido correctamente');
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener el historial clinico');
  }
}
