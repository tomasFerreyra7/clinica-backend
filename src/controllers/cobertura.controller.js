import { enviarOk, enviarError } from '../utils/respuesta.js';
import { listarCoberturas as listarCoberturasService } from '../services/cobertura.service.js';

export async function listarCoberturas(req, res) {
  try {
    const datos = await listarCoberturasService();
    return enviarOk(res, 200, datos);
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al obtener coberturas');
  }
}
