import pool from '../database/db.js';
import { validarTexto } from '../utils/validacion.js';
import { registrarAuditoria } from '../utils/auditoria.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function validarDatosCobertura({ nombre }) {
  const error = validarTexto(nombre, 'nombre', { maxLength: 30 });
  if (error) {
    throw new ErrorServicio(400, error);
  }
}

export async function listarCoberturas() {
  const [filas] = await pool.query('SELECT id, nombre FROM cobertura WHERE activo = 1 ORDER BY nombre');
  return filas;
}

export async function obtenerCobertura(id) {
  const [filas] = await pool.query('SELECT id, nombre FROM cobertura WHERE id = ? AND activo = 1', [id]);
  if (filas.length === 0) {
    throw new ErrorServicio(404, 'Cobertura no encontrada');
  }
  return filas[0];
}

export async function crearCobertura({ nombre }, idUsuario) {
  validarDatosCobertura({ nombre });

  const [resultado] = await pool.query('INSERT INTO cobertura (nombre) VALUES (?)', [nombre]);

  await registrarAuditoria({
    idUsuario,
    accion: 'ALTA',
    entidad: 'cobertura',
    detalle: `Se creo la cobertura ${resultado.insertId}`,
  });

  return { id: resultado.insertId, nombre };
}

export async function modificarCobertura(id, { nombre }, idUsuario) {
  const coberturaActual = await obtenerCobertura(id);

  const nombreNuevo = nombre !== undefined ? nombre : coberturaActual.nombre;
  validarDatosCobertura({ nombre: nombreNuevo });

  await pool.query('UPDATE cobertura SET nombre = ? WHERE id = ?', [nombreNuevo, id]);

  await registrarAuditoria({
    idUsuario,
    accion: 'MODIFICACION',
    entidad: 'cobertura',
    detalle: `Se modifico la cobertura ${id}`,
  });

  return { id: Number(id), nombre: nombreNuevo };
}

export async function eliminarCobertura(id, idUsuario) {
  await obtenerCobertura(id);

  const [usuarios] = await pool.query('SELECT id FROM usuario WHERE id_cobertura = ? LIMIT 1', [id]);
  if (usuarios.length > 0) {
    throw new ErrorServicio(409, 'No se puede eliminar la cobertura: tiene usuarios asociados');
  }

  await pool.query('UPDATE cobertura SET activo = 0 WHERE id = ?', [id]);

  await registrarAuditoria({
    idUsuario,
    accion: 'BAJA',
    entidad: 'cobertura',
    detalle: `Se dio de baja la cobertura ${id}`,
  });
}

export { ErrorServicio };
