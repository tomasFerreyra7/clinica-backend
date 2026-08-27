import pool from '../database/db.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function validarId(id, nombre = 'id') {
  if (!/^\d+$/.test(String(id)) || Number(id) <= 0) {
    throw new ErrorServicio(400, `${nombre} debe ser un numero entero positivo`);
  }
  return Number(id);
}

function validarTexto(valor, nombre) {
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new ErrorServicio(400, `${nombre} es obligatorio`);
  }
  return valor.trim();
}

function obtenerDatosHistorial(body = {}) {
  return {
    id_turno: validarId(body.id_turno, 'id_turno'),
    diagnostico: validarTexto(body.diagnostico, 'diagnostico'),
    tratamiento: validarTexto(body.tratamiento, 'tratamiento'),
    observaciones: body.observaciones === undefined || body.observaciones === null ? '' : validarTexto(body.observaciones, 'observaciones'),
  };
}

export async function crearHistorial(body, usuario) {
  if (usuario?.rol !== 'medico') {
    throw new ErrorServicio(403, 'Solo un medico puede registrar un historial');
  }

  const datos = obtenerDatosHistorial(body);
  const [turnos] = await pool.query('SELECT id, id_paciente, id_medico, estado FROM turno WHERE id = ?', [datos.id_turno]);

  if (turnos.length === 0) {
    throw new ErrorServicio(404, 'Turno no encontrado');
  }

  const turno = turnos[0];
  if (String(turno.estado).toLowerCase() !== 'atendido') {
    throw new ErrorServicio(409, 'El turno debe estar atendido para registrar el historial');
  }
  if (Number(turno.id_medico) !== Number(usuario.id)) {
    throw new ErrorServicio(403, 'El turno no pertenece al medico autenticado');
  }

  const [historiales] = await pool.query('SELECT id FROM historial_clinico WHERE id_turno = ?', [datos.id_turno]);
  if (historiales.length > 0) {
    throw new ErrorServicio(409, 'El turno ya tiene un historial registrado');
  }

  const [resultado] = await pool.query(
    `INSERT INTO historial_clinico
       (id_turno, diagnostico, tratamiento, observaciones)
     VALUES (?, ?, ?, ?)`,
    [datos.id_turno, datos.diagnostico, datos.tratamiento, datos.observaciones],
  );

  return { id: resultado.insertId, ...datos };
}

export async function listarHistorial(usuario) {
  if (!['paciente', 'medico'].includes(usuario?.rol)) {
    throw new ErrorServicio(403, 'No tiene permisos para consultar historiales');
  }

  const condiciones = usuario.rol === 'paciente' ? 't.id_paciente = ?' : 't.id_medico = ?';

  const [filas] = await pool.query(
    `SELECT h.id, h.id_turno, h.diagnostico, h.tratamiento,
            h.observaciones, h.fecha_registro
     FROM historial_clinico h
     INNER JOIN turno t ON t.id = h.id_turno
     WHERE ${condiciones}
     ORDER BY h.fecha_registro DESC, h.id DESC`,
    [usuario.id],
  );

  return filas;
}

export { ErrorServicio };

