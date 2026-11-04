import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  fechasDisponibles as fechasService,
  horariosDisponibles as horariosService,
  ErrorServicio,
} from '../services/disponibilidad.service.js';

function manejarError(res, error, mensajeGenerico) {
  if (error instanceof ErrorServicio) {
    return enviarError(res, error.codigo, error.message);
  }
  console.error(error);
  return enviarError(res, 500, mensajeGenerico);
}

export async function fechas(req, res) {
  try {
    return enviarOk(res, 200, await fechasService(req.query));
  } catch (error) {
    return manejarError(res, error, 'Error al consultar las fechas disponibles');
  }
}

export async function horarios(req, res) {
  try {
    return enviarOk(res, 200, await horariosService(req.query));
  } catch (error) {
    return manejarError(res, error, 'Error al consultar los horarios disponibles');
  }
}
