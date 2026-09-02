import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  crearEspecialidad,
  listarEspecialidades,
  actualizarEspecialidad,
  eliminarEspecialidad,
  ErrorServicio,
} from '../services/especialidad.service.js';

export async function crear(req, res) {
  try {
    const datos = await crearEspecialidad(req.body, req.usuario.id);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al crear la especialidad');
  }
}

export async function listar(req, res) {
  try {
    const datos = await listarEspecialidades();
    return enviarOk(res, 200, datos);
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al obtener especialidades');
  }
}

export async function actualizar(req, res) {
  try {
    const datos = await actualizarEspecialidad(req.params.id, req.body, req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al actualizar la especialidad');
  }
}

export async function eliminar(req, res) {
  try {
    const datos = await eliminarEspecialidad(req.params.id, req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al eliminar la especialidad');
  }
}
