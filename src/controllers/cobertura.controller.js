import pool from '../database/db.js';
import { enviarOk, enviarError } from '../utils/respuesta.js';

export async function listarCoberturas(req, res) {
  try {
    const [filas] = await pool.query('SELECT id, nombre FROM cobertura ORDER BY nombre');
    return enviarOk(res, 200, filas);
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al obtener coberturas');
  }
}
