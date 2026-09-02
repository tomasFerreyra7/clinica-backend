import pool from '../database/db.js';
import { validarRangoFechas } from '../utils/validacion.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function parsearRangoFechas(query) {
  try {
    return validarRangoFechas(query);
  } catch (error) {
    throw new ErrorServicio(400, error.message);
  }
}

function asignarPosicionesRanking(items) {
  let posicion = 0;
  let cantidadAnterior = null;

  return items.map((item, indice) => {
    if (item.cantidad !== cantidadAnterior) {
      posicion = indice + 1;
      cantidadAnterior = item.cantidad;
    }
    return { ...item, posicion };
  });
}

function calcularTasaCancelacion(total, cancelados) {
  if (total === 0) {
    return 0;
  }
  return Math.round((cancelados / total) * 10000) / 100;
}

export async function turnosPorEspecialidad(query) {
  const { desde, hasta } = parsearRangoFechas(query);

  const [filas] = await pool.query(
    `SELECT e.id AS id_especialidad, e.descripcion, COUNT(t.id) AS cantidad
     FROM especialidad e
     LEFT JOIN agenda a ON a.id_especialidad = e.id
     LEFT JOIN turno t ON t.id_agenda = a.id
       AND t.fecha BETWEEN ? AND ?
     GROUP BY e.id, e.descripcion
     ORDER BY e.descripcion ASC`,
    [desde, hasta]
  );

  return {
    desde,
    hasta,
    items: filas.map((fila) => ({
      id_especialidad: fila.id_especialidad,
      descripcion: fila.descripcion,
      cantidad: Number(fila.cantidad),
    })),
  };
}

export async function turnosPorSede(query) {
  const { desde, hasta } = parsearRangoFechas(query);

  const [filas] = await pool.query(
    `SELECT s.id AS id_sede, s.nombre, COUNT(t.id) AS cantidad
     FROM sede s
     LEFT JOIN agenda a ON a.id_sede = s.id
     LEFT JOIN turno t ON t.id_agenda = a.id
       AND t.fecha BETWEEN ? AND ?
     GROUP BY s.id, s.nombre
     ORDER BY s.nombre ASC`,
    [desde, hasta]
  );

  return {
    desde,
    hasta,
    items: filas.map((fila) => ({
      id_sede: fila.id_sede,
      nombre: fila.nombre,
      cantidad: Number(fila.cantidad),
    })),
  };
}

export async function rankingMedicos(query) {
  const { desde, hasta } = parsearRangoFechas(query);

  const [filas] = await pool.query(
    `SELECT u.id AS id_medico, u.nombre, u.apellido, COUNT(t.id) AS cantidad
     FROM turno t
     INNER JOIN agenda a ON a.id = t.id_agenda
     INNER JOIN usuario u ON u.id = a.id_medico AND u.rol = 'medico'
     WHERE t.estado = 'atendido'
       AND t.fecha BETWEEN ? AND ?
     GROUP BY u.id, u.nombre, u.apellido
     ORDER BY cantidad DESC, u.apellido ASC, u.nombre ASC`,
    [desde, hasta]
  );

  const items = filas.map((fila) => ({
    id_medico: fila.id_medico,
    nombre: fila.nombre,
    apellido: fila.apellido,
    cantidad: Number(fila.cantidad),
  }));

  return {
    desde,
    hasta,
    items: asignarPosicionesRanking(items),
  };
}

export async function tasaCancelacion(query) {
  const { desde, hasta } = parsearRangoFechas(query);

  const [filas] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) AS cancelados
     FROM turno
     WHERE fecha BETWEEN ? AND ?`,
    [desde, hasta]
  );

  const total = Number(filas[0]?.total ?? 0);
  const cancelados = Number(filas[0]?.cancelados ?? 0);

  return {
    desde,
    hasta,
    total,
    cancelados,
    tasa_cancelacion: calcularTasaCancelacion(total, cancelados),
  };
}

export { ErrorServicio };
