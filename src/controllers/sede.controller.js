import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  listarSedes as listarSedesService,
  obtenerSede as obtenerSedeService,
  crearSede as crearSedeService,
  modificarSede as modificarSedeService,
  eliminarSede as eliminarSedeService,
  ErrorServicio,
} from '../services/sede.service.js';

export async function listarSedes(req, res) {
  try {
    const datos = await listarSedesService();
    return enviarOk(res, 200, datos);
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al obtener sedes');
  }
}

export async function obtenerSede(req, res) {
  try {
    const datos = await obtenerSedeService(req.params.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener la sede');
  }
}

export async function crearSede(req, res) {
  try {
    const datos = await crearSedeService(req.body, req.usuario.id);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al crear la sede');
  }
}

export async function modificarSede(req, res) {
  try {
    const datos = await modificarSedeService(req.params.id, req.body, req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al modificar la sede');
  }
}

export async function eliminarSede(req, res) {
  try {
    await eliminarSedeService(req.params.id, req.usuario.id);
    return enviarOk(res, 200, { mensaje: 'Sede eliminada' });
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al eliminar la sede');
  }
}
