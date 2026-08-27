import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  crearTurno,
  cancelarTurno,
  atenderTurno,
  listarMisTurnos,
  listarTurnos,
  ErrorServicio,
} from '../services/turno.service.js';

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

export async function atender(req, res) {
  try {
    const datos = await atenderTurno(req.params.id, req.usuario);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al atender el turno');
  }
}

export async function listarMios(req, res) {
  try {
    const datos = await listarMisTurnos(req.usuario);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener los turnos');
  }
}

export async function listar(req, res) {
  try {
    const datos = await listarTurnos(req.query, req.usuario);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener los turnos');
  }
}
