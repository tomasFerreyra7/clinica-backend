import pool from '../database/db.js';
import { validarTexto } from '../utils/validacion.js';
import { crearNotificacion } from './notificacion.service.js';

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

const DURACION_TURNO_MIN = 30;
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

function validarFecha(valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw new ErrorServicio(400, 'fecha es obligatoria');
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
    date.getUTCFullYear() !== anio
    || date.getUTCMonth() !== mes - 1
    || date.getUTCDate() !== dia
  ) {
    throw new ErrorServicio(400, 'fecha debe tener formato YYYY-MM-DD valido');
  }
  return fecha;
}

function obtenerFechaActualLocal() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function validarFechaNoPasada(fecha) {
  if (fecha < obtenerFechaActualLocal()) {
    throw new ErrorServicio(400, 'La fecha del turno no puede ser anterior a la fecha actual');
  }
}

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function minutosAHora(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function sumarMinutosAHora(hora, minutos) {
  const total = horaAMinutos(hora) + minutos;
  if (total >= 24 * 60) {
    throw new ErrorServicio(400, 'La hora del turno supera el horario permitido');
  }
  return minutosAHora(total);
}

function validarHoraNoPasada(fecha, hora) {
  if (fecha !== obtenerFechaActualLocal()) {
    return;
  }
  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();
  if (horaAMinutos(hora) <= minutosActuales) {
    throw new ErrorServicio(400, 'La hora del turno no puede ser anterior a la hora actual');
  }
}

function seSolapan(entradaA, salidaA, entradaB, salidaB) {
  return horaAMinutos(entradaA) < horaAMinutos(salidaB)
    && horaAMinutos(salidaA) > horaAMinutos(entradaB);
}

function normalizarFechaRespuesta(fecha) {
  if (fecha instanceof Date) {
    return fecha.toISOString().slice(0, 10);
  }
  return fecha;
}

function parsearDatosTurno(body, usuario) {
  if (!body || typeof body !== 'object') {
    throw new ErrorServicio(400, 'Body invalido');
  }

  if (body.id_cobertura !== undefined) {
    throw new ErrorServicio(400, 'id_cobertura no debe enviarse manualmente');
  }

  const id_especialidad = validarEnteroPositivo(body.id_especialidad, 'id_especialidad');
  const id_sede = validarEnteroPositivo(body.id_sede, 'id_sede');
  const id_medico = validarEnteroPositivo(body.id_medico, 'id_medico');
  const fecha = validarFecha(body.fecha);
  const hora = validarHora(body.hora, 'hora');

  const errorNota = validarTexto(body.nota, 'nota', { maxLength: 40 });
  if (errorNota) {
    throw new ErrorServicio(400, errorNota);
  }
  const nota = body.nota.trim();

  validarFechaNoPasada(fecha);
  validarHoraNoPasada(fecha, hora);

  let id_paciente;
  if (usuario.rol === 'paciente') {
    if (body.id_paciente !== undefined) {
      throw new ErrorServicio(400, 'id_paciente no debe enviarse al solicitar turno como paciente');
    }
    id_paciente = Number(usuario.id);
  } else {
    if (body.id_paciente === undefined || body.id_paciente === null || body.id_paciente === '') {
      throw new ErrorServicio(400, 'id_paciente es obligatorio para el operador');
    }
    id_paciente = validarEnteroPositivo(body.id_paciente, 'id_paciente');
  }

  return { id_especialidad, id_sede, id_medico, fecha, hora, nota, id_paciente };
}

function validarOperadorSede(usuario, idSede) {
  if (usuario.rol !== 'operador') {
    return;
  }
  if (usuario.id_sede === null || usuario.id_sede === undefined) {
    throw new ErrorServicio(403, 'El operador no tiene una sede asignada');
  }
  if (Number(usuario.id_sede) !== Number(idSede)) {
    throw new ErrorServicio(403, 'No tiene permisos para gestionar turnos de otra sede');
  }
}

async function validarRelacionesTurno({ id_medico, id_especialidad, id_sede, id_paciente }) {
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

  const [sedes] = await pool.query(
    'SELECT id FROM sede WHERE id = ? AND activo = 1',
    [id_sede]
  );
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

  const [pacientes] = await pool.query(
    "SELECT id, id_cobertura FROM usuario WHERE id = ? AND rol = 'paciente'",
    [id_paciente]
  );
  if (pacientes.length === 0) {
    throw new ErrorServicio(404, 'Paciente no encontrado');
  }

  const paciente = pacientes[0];
  if (paciente.id_cobertura === null || paciente.id_cobertura === undefined) {
    throw new ErrorServicio(400, 'El paciente no tiene una cobertura asignada');
  }

  const [coberturas] = await pool.query(
    'SELECT id FROM cobertura WHERE id = ? AND activo = 1',
    [paciente.id_cobertura]
  );
  if (coberturas.length === 0) {
    throw new ErrorServicio(400, 'La cobertura del paciente no existe o no esta activa');
  }

  return { id_cobertura: paciente.id_cobertura };
}

async function buscarAgenda({ id_medico, id_especialidad, id_sede, fecha }) {
  const [agendas] = await pool.query(
    `SELECT id, hora_entrada, hora_salida, id_medico, id_especialidad, id_sede, fecha
     FROM agenda
     WHERE id_medico = ? AND id_especialidad = ? AND id_sede = ? AND fecha = ?`,
    [id_medico, id_especialidad, id_sede, fecha]
  );

  if (agendas.length === 0) {
    throw new ErrorServicio(409, 'Horario fuera de la disponibilidad del medico');
  }
  if (agendas.length > 1) {
    throw new ErrorServicio(409, 'Existe mas de un bloque de agenda para esa combinacion');
  }

  return agendas[0];
}

function validarHorarioEnAgenda(agenda, hora) {
  const horaFin = sumarMinutosAHora(hora, DURACION_TURNO_MIN);
  const dentroDeAgenda = horaAMinutos(agenda.hora_entrada) < horaAMinutos(hora)
    && horaAMinutos(horaFin) < horaAMinutos(agenda.hora_salida);

  if (!dentroDeAgenda) {
    throw new ErrorServicio(409, 'Horario fuera de la disponibilidad del medico');
  }

  return horaFin;
}

async function validarSolapeTurnos({ id_medico, fecha, hora, horaFin }) {
  const [turnos] = await pool.query(
    `SELECT t.id, t.hora
     FROM turno t
     INNER JOIN agenda a ON a.id = t.id_agenda
     WHERE a.id_medico = ?
       AND t.fecha = ?
       AND t.estado = 'confirmado'`,
    [id_medico, fecha]
  );

  const haySolape = turnos.some((turno) => {
    const finExistente = sumarMinutosAHora(turno.hora, DURACION_TURNO_MIN);
    return seSolapan(hora, horaFin, turno.hora, finExistente);
  });

  if (haySolape) {
    throw new ErrorServicio(409, 'El horario se superpone con otro turno confirmado');
  }
}

function mapearTurno(fila) {
  return {
    id: fila.id,
    fecha: normalizarFechaRespuesta(fila.fecha),
    hora: fila.hora,
    nota: fila.nota,
    estado: fila.estado,
    id_paciente: fila.id_paciente,
    id_cobertura: fila.id_cobertura,
    id_agenda: fila.id_agenda,
    id_medico: fila.id_medico,
    id_especialidad: fila.id_especialidad,
    id_sede: fila.id_sede,
  };
}

export async function crearTurno(body, usuario) {
  const datos = parsearDatosTurno(body, usuario);
  validarOperadorSede(usuario, datos.id_sede);

  const { id_cobertura } = await validarRelacionesTurno(datos);
  const agenda = await buscarAgenda(datos);
  const horaFin = validarHorarioEnAgenda(agenda, datos.hora);

  await validarSolapeTurnos({
    id_medico: datos.id_medico,
    fecha: datos.fecha,
    hora: datos.hora,
    horaFin,
  });

  const [resultado] = await pool.query(
    `INSERT INTO turno (nota, id_agenda, fecha, hora, id_paciente, id_cobertura, estado)
     VALUES (?, ?, ?, ?, ?, ?, 'confirmado')`,
    [datos.nota, agenda.id, datos.fecha, datos.hora, datos.id_paciente, id_cobertura]
  );

  await crearNotificacion(
    datos.id_paciente,
    'turno_creado',
    `Turno confirmado para el ${datos.fecha} a las ${datos.hora}`
  );

  return mapearTurno({
    id: resultado.insertId,
    ...datos,
    id_cobertura,
    id_agenda: agenda.id,
    estado: 'confirmado',
  });
}

export { ErrorServicio, DURACION_TURNO_MIN };
