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
  if (valor.trim().length > 255) {
    throw new ErrorServicio(400, `${nombre} no puede superar los 255 caracteres`);
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
  const [turnos] = await pool.query(
    `SELECT t.id, t.id_paciente, t.estado, a.id_medico
     FROM turno t
     INNER JOIN agenda a ON a.id = t.id_agenda
     WHERE t.id = ?`,
    [datos.id_turno]
  );

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
       (id_turno, id_medico, id_paciente, diagnostico, tratamiento, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      datos.id_turno,
      turno.id_medico,
      turno.id_paciente,
      datos.diagnostico,
      datos.tratamiento,
      datos.observaciones,
    ]
  );

  return { id: resultado.insertId, ...datos };
}

function formatearFechaLocal(valor) {
  if (valor instanceof Date) {
    const mm = String(valor.getMonth() + 1).padStart(2, '0');
    const dd = String(valor.getDate()).padStart(2, '0');
    return `${valor.getFullYear()}-${mm}-${dd}`;
  }
  return valor;
}

export async function listarHistorial(usuario, query = {}) {
  if (!['paciente', 'medico'].includes(usuario?.rol)) {
    throw new ErrorServicio(403, 'No tiene permisos para consultar historiales');
  }

  const condiciones = [usuario.rol === 'paciente' ? 'h.id_paciente = ?' : 'h.id_medico = ?'];
  const valores = [usuario.id];

  const tieneFiltroPaciente = query.id_paciente !== undefined && query.id_paciente !== '';
  if (tieneFiltroPaciente) {
    const idPaciente = validarId(query.id_paciente, 'id_paciente');
    if (usuario.rol === 'paciente' && idPaciente !== Number(usuario.id)) {
      throw new ErrorServicio(403, 'No tiene permisos para consultar el historial de otro paciente');
    }
    condiciones.push('h.id_paciente = ?');
    valores.push(idPaciente);
  }

  const [filas] = await pool.query(
    `SELECT h.id, h.id_turno, h.id_paciente, h.id_medico, h.diagnostico, h.tratamiento,
            h.observaciones, h.fecha_registro,
            t.fecha AS fecha_turno, t.hora AS hora_turno,
            e.descripcion AS especialidad_descripcion, s.nombre AS sede_nombre,
            p.nombre AS paciente_nombre, p.apellido AS paciente_apellido,
            m.nombre AS medico_nombre, m.apellido AS medico_apellido
     FROM historial_clinico h
     INNER JOIN turno t ON t.id = h.id_turno
     INNER JOIN agenda a ON a.id = t.id_agenda
     INNER JOIN especialidad e ON e.id = a.id_especialidad
     INNER JOIN sede s ON s.id = a.id_sede
     INNER JOIN usuario p ON p.id = h.id_paciente
     INNER JOIN usuario m ON m.id = h.id_medico
     WHERE ${condiciones.join(' AND ')}
     ORDER BY t.fecha DESC, t.hora DESC, h.id DESC`,
    valores
  );

  return filas.map((f) => ({ ...f, fecha_turno: formatearFechaLocal(f.fecha_turno) }));
}

export { ErrorServicio };
