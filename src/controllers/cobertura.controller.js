import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  listarCoberturas as listarCoberturasService,
  obtenerCobertura as obtenerCoberturaService,
  crearCobertura as crearCoberturaService,
  modificarCobertura as modificarCoberturaService,
  eliminarCobertura as eliminarCoberturaService,
  ErrorServicio,
} from '../services/cobertura.service.js';

export async function listarCoberturas(req, res) {
  try {
    const datos = await listarCoberturasService();
    return enviarOk(res, 200, datos);
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al obtener coberturas');
  }
}

export async function obtenerCobertura(req, res) {
  try {
    const datos = await obtenerCoberturaService(req.params.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener la cobertura');
  }
}

export async function crearCobertura(req, res) {
  try {
    const datos = await crearCoberturaService(req.body, req.usuario.id);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al crear la cobertura');
  }
}

export async function modificarCobertura(req, res) {
  try {
    const datos = await modificarCoberturaService(req.params.id, req.body, req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al modificar la cobertura');
  }
}

export async function eliminarCobertura(req, res) {
  try {
    await eliminarCoberturaService(req.params.id, req.usuario.id);
    return enviarOk(res, 200, { mensaje: 'Cobertura eliminada' });
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al eliminar la cobertura');
  }
}
