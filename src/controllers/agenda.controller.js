import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  crearAgenda,
  listarAgendas,
  actualizarAgenda,
  eliminarAgenda,
  ErrorServicio,
} from '../services/agenda.service.js';

export async function crear(req, res) {
  try {
    const datos = await crearAgenda(req.body, req.usuario);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al crear la agenda');
  }
}

export async function listar(req, res) {
  try {
    const datos = await listarAgendas(req.query, req.usuario);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener agendas');
  }
}

export async function actualizar(req, res) {
  try {
    const datos = await actualizarAgenda(req.params.id, req.body, req.usuario);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al actualizar la agenda');
  }
}

export async function eliminar(req, res) {
  try {
    const datos = await eliminarAgenda(req.params.id, req.usuario);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al eliminar la agenda');
  }
}
