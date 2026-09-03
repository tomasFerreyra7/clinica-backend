import pool from '../database/db.js';
import { registrarAuditoria } from '../utils/auditoria.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function validarId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ErrorServicio(400, 'El id debe ser un numero entero positivo');
  }
  return n;
}

function validarDescripcion(descripcion) {
  if (descripcion === undefined || descripcion === null) {
    throw new ErrorServicio(400, 'La descripcion es obligatoria');
  }
  if (typeof descripcion !== 'string') {
    throw new ErrorServicio(400, 'La descripcion debe ser un texto');
  }
  const valor = descripcion.trim();
  if (!valor) {
    throw new ErrorServicio(400, 'La descripcion es obligatoria');
  }
  if (valor.length > 30) {
    throw new ErrorServicio(400, 'La descripcion no puede superar los 30 caracteres');
  }
  return valor;
}

export async function crearEspecialidad({ descripcion }, idUsuario) {
  const valor = validarDescripcion(descripcion);

  const [duplicadas] = await pool.query(
    'SELECT id FROM especialidad WHERE descripcion = ?',
    [valor]
  );
  if (duplicadas.length > 0) {
    throw new ErrorServicio(409, 'Ya existe una especialidad con esa descripcion');
  }

  const [resultado] = await pool.query(
    'INSERT INTO especialidad (descripcion) VALUES (?)',
    [valor]
  );

  await registrarAuditoria({
    idUsuario,
    accion: 'ALTA',
    entidad: 'especialidad',
    detalle: `Se creo la especialidad ${resultado.insertId}`,
  });

  return { id: resultado.insertId, descripcion: valor };
}

export async function listarEspecialidades() {
  const [filas] = await pool.query(
    'SELECT id, descripcion FROM especialidad ORDER BY descripcion'
  );
  return filas;
}

export async function actualizarEspecialidad(id, { descripcion }, idUsuario) {
  const idNum = validarId(id);
  const valor = validarDescripcion(descripcion);

  const [existentes] = await pool.query(
    'SELECT id FROM especialidad WHERE id = ?',
    [idNum]
  );
  if (existentes.length === 0) {
    throw new ErrorServicio(404, 'Especialidad no encontrada');
  }

  const [duplicadas] = await pool.query(
    'SELECT id FROM especialidad WHERE descripcion = ? AND id <> ?',
    [valor, idNum]
  );
  if (duplicadas.length > 0) {
    throw new ErrorServicio(409, 'Ya existe una especialidad con esa descripcion');
  }

  await pool.query(
    'UPDATE especialidad SET descripcion = ? WHERE id = ?',
    [valor, idNum]
  );

  await registrarAuditoria({
    idUsuario,
    accion: 'MODIFICACION',
    entidad: 'especialidad',
    detalle: `Se modifico la especialidad ${idNum}`,
  });

  return { id: idNum, descripcion: valor };
}

export async function eliminarEspecialidad(id, idUsuario) {
  const idNum = validarId(id);

  const [existentes] = await pool.query(
    'SELECT id FROM especialidad WHERE id = ?',
    [idNum]
  );
  if (existentes.length === 0) {
    throw new ErrorServicio(404, 'Especialidad no encontrada');
  }

  const [asociados] = await pool.query(
    'SELECT id FROM medico_especialidad WHERE id_especialidad = ? LIMIT 1',
    [idNum]
  );
  if (asociados.length > 0) {
    throw new ErrorServicio(
      409,
      'No se puede eliminar la especialidad porque tiene medicos asociados'
    );
  }

  await pool.query('DELETE FROM especialidad WHERE id = ?', [idNum]);

  await registrarAuditoria({
    idUsuario,
    accion: 'BAJA',
    entidad: 'especialidad',
    detalle: `Se dio de baja la especialidad ${idNum}`,
  });

  return { id: idNum };
}

export { ErrorServicio };
