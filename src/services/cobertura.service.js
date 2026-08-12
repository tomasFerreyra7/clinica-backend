import pool from '../database/db.js';

export async function listarCoberturas() {
  const [filas] = await pool.query('SELECT id, nombre FROM cobertura ORDER BY nombre');
  return filas;
}
