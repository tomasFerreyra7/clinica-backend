import pool from '../database/db.js';
import { validarTexto } from '../utils/validacion.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function validarDatosSede({ nombre, direccion, telefono }) {
  const errores = [
    validarTexto(nombre, 'nombre', { maxLength: 50 }),
    validarTexto(direccion, 'direccion', { maxLength: 100 }),
    validarTexto(telefono, 'telefono', { maxLength: 15 }),
  ].filter(Boolean);

  if (errores.length > 0) {
    throw new ErrorServicio(400, errores.join('; '));
  }
}

export async function listarSedes() {
  const [filas] = await pool.query(
    'SELECT id, nombre, direccion, telefono FROM sede WHERE activo = 1 ORDER BY nombre'
  );
  return filas;
}

export async function obtenerSede(id) {
  const [filas] = await pool.query(
    'SELECT id, nombre, direccion, telefono FROM sede WHERE id = ? AND activo = 1',
    [id]
  );
  if (filas.length === 0) {
    throw new ErrorServicio(404, 'Sede no encontrada');
  }
  return filas[0];
}

export async function crearSede({ nombre, direccion, telefono }) {
  validarDatosSede({ nombre, direccion, telefono });

  const [resultado] = await pool.query(
    'INSERT INTO sede (nombre, direccion, telefono) VALUES (?, ?, ?)',
    [nombre, direccion, telefono]
  );

  return { id: resultado.insertId, nombre, direccion, telefono };
}

export async function modificarSede(id, { nombre, direccion, telefono }) {
  const sedeActual = await obtenerSede(id);

  const datosNuevos = {
    nombre: nombre !== undefined ? nombre : sedeActual.nombre,
    direccion: direccion !== undefined ? direccion : sedeActual.direccion,
    telefono: telefono !== undefined ? telefono : sedeActual.telefono,
  };
  validarDatosSede(datosNuevos);

  await pool.query(
    'UPDATE sede SET nombre = ?, direccion = ?, telefono = ? WHERE id = ?',
    [datosNuevos.nombre, datosNuevos.direccion, datosNuevos.telefono, id]
  );

  return { id: Number(id), ...datosNuevos };
}

export async function eliminarSede(id) {
  await obtenerSede(id);

  const [medicosOperadores] = await pool.query(
    "SELECT id FROM usuario WHERE id_sede = ? AND rol IN ('medico', 'operador') LIMIT 1",
    [id]
  );
  if (medicosOperadores.length > 0) {
    throw new ErrorServicio(409, 'No se puede eliminar la sede: tiene medicos u operadores asociados');
  }

  const [agendas] = await pool.query('SELECT id FROM agenda WHERE id_sede = ? LIMIT 1', [id]);
  if (agendas.length > 0) {
    throw new ErrorServicio(409, 'No se puede eliminar la sede: tiene agenda asociada');
  }

  await pool.query('UPDATE sede SET activo = 0 WHERE id = ?', [id]);
}

export { ErrorServicio };
