import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  ErrorServicio,
} from '../services/usuario.service.js';

export async function listar(req, res) {
  try {
    const datos = await listarUsuarios(req.query);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener los usuarios');
  }
}

export async function obtener(req, res) {
  try {
    const datos = await obtenerUsuario(req.params.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener el usuario');
  }
}

export async function crear(req, res) {
  try {
    const datos = await crearUsuario(req.body, req.usuario.id);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al crear el usuario');
  }
}

export async function actualizar(req, res) {
  try {
    const datos = await actualizarUsuario(req.params.id, req.body, req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al actualizar el usuario');
  }
}
