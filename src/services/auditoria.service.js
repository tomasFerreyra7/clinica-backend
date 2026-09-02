import pool from '../database/db.js';
import { validarEnteroPositivo, validarFecha } from '../utils/validacion.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function obtenerFiltros(query = {}) {
  const filtros = [];
  const parametros = [];

  if (query.id_usuario !== undefined) {
    let idUsuario;
    try {
      idUsuario = validarEnteroPositivo(query.id_usuario, 'id_usuario');
    } catch (error) {
      throw new ErrorServicio(400, error.message);
    }
    filtros.push('id_usuario = ?');
    parametros.push(idUsuario);
  }

  if (query.entidad !== undefined) {
    const entidad = String(query.entidad).trim();
    const entidadesValidas = ['usuario', 'cobertura', 'especialidad', 'sede'];

    if (!entidadesValidas.includes(entidad)) {
      throw new ErrorServicio(400, 'entidad no valida');
    }

    filtros.push('entidad = ?');
    parametros.push(entidad);
  }

  const tieneDesde = query.desde !== undefined;
  const tieneHasta = query.hasta !== undefined;

  if (tieneDesde !== tieneHasta) {
    throw new ErrorServicio(400, 'Debe indicar desde y hasta');
  }

  if (tieneDesde && tieneHasta) {
    const desde = validarFecha(query.desde, 'desde');
    const hasta = validarFecha(query.hasta, 'hasta');

    if (desde > hasta) {
      throw new ErrorServicio(400, 'desde no puede ser posterior a hasta');
    }

    filtros.push('fecha >= ? AND fecha < DATE_ADD(?, INTERVAL 1 DAY)');
    parametros.push(`${desde} 00:00:00`, `${hasta} 00:00:00`);
  }

  return { filtros, parametros };
}

export async function listarAuditoria(query = {}) {
  const { filtros, parametros } = obtenerFiltros(query);
  const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

  const [filas] = await pool.query(
    `SELECT id, id_usuario, accion, entidad, detalle, fecha
     FROM log_auditoria
     ${where}
     ORDER BY fecha DESC, id DESC`,
    parametros
  );

  return filas;
}

export { ErrorServicio };
