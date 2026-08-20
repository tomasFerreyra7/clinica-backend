import pool from '../database/db.js';

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

function validarFecha(valor) {
  if (valor === undefined || valor === null || typeof valor !== 'string' || !valor.trim()) {
    throw new ErrorServicio(400, 'fecha es obligatoria');
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

export async function crearAgenda(body) {
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

  const [existentes] = await pool.query(
    'SELECT id, hora_entrada, hora_salida FROM agenda WHERE id_medico = ? AND fecha = ?',
    [id_medico, fecha]
  );
  const haySolape = existentes.some((fila) =>
    seSolapan(hora_entrada, hora_salida, fila.hora_entrada, fila.hora_salida)
  );
  if (haySolape) {
    throw new ErrorServicio(
      409,
      'El horario se solapa con otra agenda del mismo medico en esa fecha'
    );
  }

  const [resultado] = await pool.query(
    `INSERT INTO agenda (hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede]
  );

  return {
    id: resultado.insertId,
    hora_entrada,
    hora_salida,
    fecha,
    id_medico,
    id_especialidad,
    id_sede,
  };
}

export { ErrorServicio };
