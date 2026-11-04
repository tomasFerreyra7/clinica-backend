import pool from '../database/db.js';
import { DURACION_TURNO_MIN } from '../config/turnos.js';

export class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function validarId(valor, nombre) {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor) || Number(valor) <= 0) {
    throw new ErrorServicio(400, `${nombre} es obligatorio y debe ser un numero entero positivo`);
  }
  return Number(valor);
}

function validarFecha(valor) {
  if (typeof valor !== 'string' || !REGEX_FECHA.test(valor)) {
    throw new ErrorServicio(400, 'fecha es obligatoria y debe tener formato YYYY-MM-DD');
  }
  const [a, m, d] = valor.split('-').map(Number);
  const real = new Date(a, m - 1, d);
  if (real.getFullYear() !== a || real.getMonth() !== m - 1 || real.getDate() !== d) {
    throw new ErrorServicio(400, 'fecha no es una fecha valida');
  }
  return valor;
}

function aFechaLocal(fecha) {
  if (fecha instanceof Date) {
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mm}-${dd}`;
  }
  return fecha;
}

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function minutosAHora(minutos) {
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
}

function ahoraLocal() {
  const ahora = new Date();
  return {
    fecha: aFechaLocal(ahora),
    minutos: ahora.getHours() * 60 + ahora.getMinutes(),
  };
}

// Mismo criterio que el alta de turno: no se aceptan horas que ya pasaron hoy.
async function calcularLibres({ idMedico, idEspecialidad, idSede, fechaExacta = null }) {
  const hoy = ahoraLocal();

  const condiciones = ['a.id_medico = ?', 'a.id_especialidad = ?', 'a.id_sede = ?'];
  const valores = [idMedico, idEspecialidad, idSede];
  if (fechaExacta !== null) {
    condiciones.push('a.fecha = ?');
    valores.push(fechaExacta);
  } else {
    condiciones.push('a.fecha >= ?');
    valores.push(hoy.fecha);
  }

  const [agendas] = await pool.query(
    `SELECT a.fecha, a.hora_entrada, a.hora_salida
     FROM agenda a
     WHERE ${condiciones.join(' AND ')}
     ORDER BY a.fecha, a.hora_entrada`,
    valores
  );
  if (agendas.length === 0) {
    return new Map();
  }

  const fechas = [...new Set(agendas.map((a) => aFechaLocal(a.fecha)))];
  // El medico no puede estar en dos turnos a la vez: se consideran todas sus sedes y especialidades.
  const [turnos] = await pool.query(
    `SELECT t.fecha, t.hora
     FROM turno t
     INNER JOIN agenda a ON a.id = t.id_agenda
     WHERE a.id_medico = ? AND t.estado = 'confirmado' AND t.fecha IN (?)`,
    [idMedico, fechas]
  );
  const ocupados = new Map();
  for (const t of turnos) {
    const f = aFechaLocal(t.fecha);
    if (!ocupados.has(f)) ocupados.set(f, []);
    ocupados.get(f).push(horaAMinutos(t.hora));
  }

  const libres = new Map();
  for (const a of agendas) {
    const f = aFechaLocal(a.fecha);
    const tomados = ocupados.get(f) ?? [];
    const salida = horaAMinutos(a.hora_salida);
    for (let inicio = horaAMinutos(a.hora_entrada); inicio + DURACION_TURNO_MIN <= salida; inicio += DURACION_TURNO_MIN) {
      if (f === hoy.fecha && inicio <= hoy.minutos) continue;
      const solapa = tomados.some((t) => inicio < t + DURACION_TURNO_MIN && inicio + DURACION_TURNO_MIN > t);
      if (solapa) continue;
      if (!libres.has(f)) libres.set(f, new Set());
      libres.get(f).add(minutosAHora(inicio));
    }
  }
  return libres;
}

function leerFiltros(query) {
  return {
    idMedico: validarId(query.id_medico, 'id_medico'),
    idEspecialidad: validarId(query.id_especialidad, 'id_especialidad'),
    idSede: validarId(query.id_sede, 'id_sede'),
  };
}

export async function fechasDisponibles(query = {}) {
  const filtros = leerFiltros(query);
  const libres = await calcularLibres(filtros);
  return [...libres.keys()].sort();
}

export async function horariosDisponibles(query = {}) {
  const filtros = leerFiltros(query);
  const fecha = validarFecha(query.fecha);
  if (fecha < ahoraLocal().fecha) {
    return [];
  }
  const libres = await calcularLibres({ ...filtros, fechaExacta: fecha });
  return [...(libres.get(fecha) ?? [])].sort();
}
