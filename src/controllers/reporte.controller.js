import { enviarOk, enviarError } from '../utils/respuesta.js';
import {
  turnosPorEspecialidad,
  turnosPorSede,
  rankingMedicos,
  tasaCancelacion,
  ErrorServicio,
} from '../services/reporte.service.js';

async function ejecutarReporte(res, fn, query) {
  try {
    const datos = await fn(query);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener el reporte');
  }
}

export async function reporteTurnosPorEspecialidad(req, res) {
  return ejecutarReporte(res, turnosPorEspecialidad, req.query);
}

export async function reporteTurnosPorSede(req, res) {
  return ejecutarReporte(res, turnosPorSede, req.query);
}

export async function reporteRankingMedicos(req, res) {
  return ejecutarReporte(res, rankingMedicos, req.query);
}

export async function reporteTasaCancelacion(req, res) {
  return ejecutarReporte(res, tasaCancelacion, req.query);
}
