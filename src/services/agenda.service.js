import pool from '../database/db.js';
import { DURACION_TURNO_MIN } from '../config/turnos.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

const REGEX_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validarEnteroPositivo(valor, nombreCampo) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ErrorServicio(400, `${nombreCampo} debe ser un numero entero positivo`);
  }
  return n;
}

function validarHora(valor, nombreCampo) {
  if (valor === undefined || valor === null || typeof valor !== 'string' || !valor.trim()) {
    throw new ErrorServicio(400, `${nombreCampo} es obligatoria`);
  }
  const hora = valor.trim();
  if (!REGEX_HORA.test(hora)) {
    throw new ErrorServicio(400, `${nombreCampo} debe tener formato HH:MM`);
  }
  return hora;
}

function validarFecha(valor, { requerida = true } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (requerida) {
      throw new ErrorServicio(400, 'fecha es obligatoria');
    }
    return null;
  }
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new ErrorServicio(400, 'fecha debe tener formato YYYY-MM-DD valido');
  }
  const fecha = valor.trim();
  if (!REGEX_FECHA.test(fecha)) {
    throw new ErrorServicio(400, 'fecha debe tener formato YYYY-MM-DD valido');
  }
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    date.getUTCFullYear() !== anio ||
    date.getUTCMonth() !== mes - 1 ||
    date.getUTCDate() !== dia
  ) {
    throw new ErrorServicio(400, 'fecha debe tener formato YYYY-MM-DD valido');
  }
  return fecha;
}

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function seSolapan(entradaA, salidaA, entradaB, salidaB) {
  return horaAMinutos(entradaA) < horaAMinutos(salidaB)
    && horaAMinutos(salidaA) > horaAMinutos(entradaB);
}

function parsearDatosAgenda(body) {
  if (!body || typeof body !== 'object') {
    throw new ErrorServicio(400, 'Body invalido');
  }

  const hora_entrada = validarHora(body.hora_entrada, 'hora_entrada');
  const hora_salida = validarHora(body.hora_salida, 'hora_salida');
  const fecha = validarFecha(body.fecha);
  const id_medico = validarEnteroPositivo(body.id_medico, 'id_medico');
  const id_especialidad = validarEnteroPositivo(body.id_especialidad, 'id_especialidad');
  const id_sede = validarEnteroPositivo(body.id_sede, 'id_sede');

  if (horaAMinutos(hora_entrada) >= horaAMinutos(hora_salida)) {
    throw new ErrorServicio(400, 'hora_entrada debe ser anterior a hora_salida');
  }

  return { hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede };
}

async function validarRelacionesAgenda({ id_medico, id_especialidad, id_sede }) {
  const [medicos] = await pool.query(
    "SELECT id FROM usuario WHERE id = ? AND rol = 'medico'",
    [id_medico]
  );
  if (medicos.length === 0) {
    throw new ErrorServicio(400, 'El medico indicado no existe');
  }

  const [especialidades] = await pool.query(
    'SELECT id FROM especialidad WHERE id = ?',
    [id_especialidad]
  );
  if (especialidades.length === 0) {
    throw new ErrorServicio(400, 'La especialidad indicada no existe');
  }

  const [sedes] = await pool.query('SELECT id FROM sede WHERE id = ?', [id_sede]);
  if (sedes.length === 0) {
    throw new ErrorServicio(400, 'La sede indicada no existe');
  }

  const [vinculos] = await pool.query(
    'SELECT id FROM medico_especialidad WHERE id_medico = ? AND id_especialidad = ?',
    [id_medico, id_especialidad]
  );
  if (vinculos.length === 0) {
    throw new ErrorServicio(400, 'El medico no tiene asociada esa especialidad');
  }
}

async function validarSolapamiento({ id_medico, fecha, hora_entrada, hora_salida, excluirId = null }) {
  const [existentes] = await pool.query(
    'SELECT id, hora_entrada, hora_salida FROM agenda WHERE id_medico = ? AND fecha = ?',
    [id_medico, fecha]
  );

  const haySolape = existentes.some((fila) => {
    if (excluirId !== null && fila.id === excluirId) return false;
    return seSolapan(hora_entrada, hora_salida, fila.hora_entrada, fila.hora_salida);
  });

  if (haySolape) {
    throw new ErrorServicio(
      409,
      'El horario se solapa con otra agenda del mismo medico en esa fecha'
    );
  }
}

function normalizarFechaRespuesta(fecha) {
  if (fecha instanceof Date) {
    return fecha.toISOString().slice(0, 10);
  }
  return fecha;
}

function mapearAgenda(fila) {
  return {
    id: fila.id,
    hora_entrada: fila.hora_entrada,
    hora_salida: fila.hora_salida,
    fecha: normalizarFechaRespuesta(fila.fecha),
    id_medico: fila.id_medico,
    id_especialidad: fila.id_especialidad,
    id_sede: fila.id_sede,
  };
}

function mapearAgendaDetallada(fila) {
  return {
    ...mapearAgenda(fila),
    medico_nombre: fila.medico_nombre,
    medico_apellido: fila.medico_apellido,
    especialidad_descripcion: fila.especialidad_descripcion,
    sede_nombre: fila.sede_nombre,
  };
}

function verificarAgendaDelMedico(usuario, idMedicoObjetivo) {
  if (usuario?.rol === 'medico' && Number(usuario.id) !== Number(idMedicoObjetivo)) {
    throw new ErrorServicio(403, 'No tiene permisos para gestionar la agenda de otro medico');
  }
}

function verificarSedeDelOperador(usuario, idSede) {
  if (usuario?.rol !== 'operador') {
    return;
  }
  if (usuario.id_sede === null || usuario.id_sede === undefined) {
    throw new ErrorServicio(403, 'El operador no tiene una sede asignada');
  }
  if (Number(usuario.id_sede) !== Number(idSede)) {
    throw new ErrorServicio(403, 'No tiene permisos para gestionar la agenda de otra sede');
  }
}

async function obtenerTurnosConfirmados(idAgenda) {
  const [turnos] = await pool.query(
    "SELECT id, hora FROM turno WHERE id_agenda = ? AND estado = 'confirmado'",
    [idAgenda]
  );
  return turnos;
}

async function validarTurnosConfirmadosAlModificar(agendaActual, datos) {
  const turnos = await obtenerTurnosConfirmados(agendaActual.id);
  if (turnos.length === 0) {
    return;
  }

  const cambiaIdentidad = normalizarFechaRespuesta(agendaActual.fecha) !== datos.fecha
    || Number(agendaActual.id_medico) !== datos.id_medico
    || Number(agendaActual.id_especialidad) !== datos.id_especialidad
    || Number(agendaActual.id_sede) !== datos.id_sede;
  if (cambiaIdentidad) {
    throw new ErrorServicio(
      409,
      'No se puede cambiar la fecha, el medico, la especialidad o la sede de una agenda con turnos confirmados'
    );
  }

  const entrada = horaAMinutos(datos.hora_entrada);
  const salida = horaAMinutos(datos.hora_salida);
  const fueraDeRango = turnos.some((t) => {
    const inicio = horaAMinutos(t.hora);
    return inicio < entrada || inicio + DURACION_TURNO_MIN > salida;
  });
  if (fueraDeRango) {
    throw new ErrorServicio(
      409,
      'No se puede modificar el horario: hay turnos confirmados que quedarian fuera del nuevo rango'
    );
  }
}

export async function crearAgenda(body, usuario) {
  const datos = parsearDatosAgenda(body);
  verificarAgendaDelMedico(usuario, datos.id_medico);
  verificarSedeDelOperador(usuario, datos.id_sede);
  await validarRelacionesAgenda(datos);
  await validarSolapamiento(datos);

  const [resultado] = await pool.query(
    `INSERT INTO agenda (hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      datos.hora_entrada,
      datos.hora_salida,
      datos.fecha,
      datos.id_medico,
      datos.id_especialidad,
      datos.id_sede,
    ]
  );

  return { id: resultado.insertId, ...datos };
}

export async function listarAgendas(query = {}, usuario) {
  const filtros = [];
  const valores = [];

  if (usuario?.rol === 'medico') {
    if (query.id_medico !== undefined && query.id_medico !== '') {
      const idQuery = validarEnteroPositivo(Number(query.id_medico), 'id_medico');
      verificarAgendaDelMedico(usuario, idQuery);
    }
    filtros.push('a.id_medico = ?');
    valores.push(Number(usuario.id));
  } else if (query.id_medico !== undefined && query.id_medico !== '') {
    filtros.push('a.id_medico = ?');
    valores.push(validarEnteroPositivo(Number(query.id_medico), 'id_medico'));
  }

  if (query.id_sede !== undefined && query.id_sede !== '') {
    filtros.push('a.id_sede = ?');
    valores.push(validarEnteroPositivo(Number(query.id_sede), 'id_sede'));
  }

  if (query.id_especialidad !== undefined && query.id_especialidad !== '') {
    filtros.push('a.id_especialidad = ?');
    valores.push(validarEnteroPositivo(Number(query.id_especialidad), 'id_especialidad'));
  }

  if (query.fecha !== undefined && query.fecha !== '') {
    filtros.push('a.fecha = ?');
    valores.push(validarFecha(query.fecha));
  }

  let sql = `SELECT a.id, a.hora_entrada, a.hora_salida, a.fecha, a.id_medico, a.id_especialidad, a.id_sede,
                    m.nombre AS medico_nombre, m.apellido AS medico_apellido,
                    e.descripcion AS especialidad_descripcion, s.nombre AS sede_nombre
             FROM agenda a
             INNER JOIN usuario m ON m.id = a.id_medico
             INNER JOIN especialidad e ON e.id = a.id_especialidad
             INNER JOIN sede s ON s.id = a.id_sede`;
  if (filtros.length > 0) {
    sql += ` WHERE ${filtros.join(' AND ')}`;
  }
  sql += ' ORDER BY a.fecha ASC, a.hora_entrada ASC';

  const [filas] = await pool.query(sql, valores);
  return filas.map(mapearAgendaDetallada);
}

function validarIdParam(id) {
  if (!/^\d+$/.test(String(id)) || Number(id) <= 0) {
    throw new ErrorServicio(400, 'El id debe ser un numero entero positivo');
  }
  return Number(id);
}

export async function actualizarAgenda(id, body, usuario) {
  const idAgenda = validarIdParam(id);

  const [existentes] = await pool.query(
    'SELECT id, id_medico, id_especialidad, id_sede, fecha FROM agenda WHERE id = ?',
    [idAgenda]
  );
  if (existentes.length === 0) {
    throw new ErrorServicio(404, 'Agenda no encontrada');
  }

  verificarAgendaDelMedico(usuario, existentes[0].id_medico);
  verificarSedeDelOperador(usuario, existentes[0].id_sede);

  const datos = parsearDatosAgenda(body);
  verificarAgendaDelMedico(usuario, datos.id_medico);
  verificarSedeDelOperador(usuario, datos.id_sede);
  await validarRelacionesAgenda(datos);
  await validarSolapamiento({ ...datos, excluirId: idAgenda });
  await validarTurnosConfirmadosAlModificar(existentes[0], datos);

  await pool.query(
    `UPDATE agenda
     SET hora_entrada = ?, hora_salida = ?, fecha = ?, id_medico = ?, id_especialidad = ?, id_sede = ?
     WHERE id = ?`,
    [
      datos.hora_entrada,
      datos.hora_salida,
      datos.fecha,
      datos.id_medico,
      datos.id_especialidad,
      datos.id_sede,
      idAgenda,
    ]
  );

  return { id: idAgenda, ...datos };
}

export async function eliminarAgenda(id, usuario) {
  const idAgenda = validarIdParam(id);

  const [existentes] = await pool.query(
    'SELECT id, id_medico, id_sede FROM agenda WHERE id = ?',
    [idAgenda]
  );
  if (existentes.length === 0) {
    throw new ErrorServicio(404, 'Agenda no encontrada');
  }

  verificarAgendaDelMedico(usuario, existentes[0].id_medico);
  verificarSedeDelOperador(usuario, existentes[0].id_sede);

  const turnosConfirmados = await obtenerTurnosConfirmados(idAgenda);
  if (turnosConfirmados.length > 0) {
    throw new ErrorServicio(409, 'No se puede eliminar la agenda: tiene turnos confirmados');
  }

  const [turnosAsociados] = await pool.query(
    'SELECT id FROM turno WHERE id_agenda = ? LIMIT 1',
    [idAgenda]
  );
  if (turnosAsociados.length > 0) {
    throw new ErrorServicio(409, 'No se puede eliminar la agenda: tiene turnos cancelados o atendidos asociados');
  }

  await pool.query('DELETE FROM agenda WHERE id = ?', [idAgenda]);
  return { id: idAgenda };
}

export { ErrorServicio };
