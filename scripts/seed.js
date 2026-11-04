// Datos de prueba para desarrollo y defensa. Idempotente: se puede ejecutar varias veces.
// Uso: pnpm seed   (o: node scripts/seed.js)
// No borra ni modifica datos existentes; solo agrega lo que falta.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from '../src/database/db.js';

const PASSWORD = 'Test1234!';
const SEDE_CENTRO = 1;
const SEDE_SUR = 6;

function fecha(offsetDias) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

async function buscarOCrear(selectSql, selectParams, insertSql, insertParams) {
  const [existentes] = await pool.query(selectSql, selectParams);
  if (existentes.length > 0) {
    return { id: existentes[0].id, creado: false };
  }
  const [r] = await pool.query(insertSql, insertParams);
  return { id: r.insertId, creado: true };
}

const stats = { creados: 0, existentes: 0 };
function contar(r) {
  r.creado ? stats.creados++ : stats.existentes++;
  return r.id;
}

async function especialidad(descripcion) {
  return contar(await buscarOCrear(
    'SELECT id FROM especialidad WHERE descripcion = ?', [descripcion],
    'INSERT INTO especialidad (descripcion) VALUES (?)', [descripcion],
  ));
}

async function usuario(u, hash) {
  return contar(await buscarOCrear(
    'SELECT id FROM usuario WHERE dni = ?', [u.dni],
    `INSERT INTO usuario (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [u.apellido, u.nombre, u.nacimiento, hash, u.rol, u.email, u.telefono, u.dni, u.id_sede ?? null, u.id_cobertura ?? null],
  ));
}

async function medicoEspecialidad(idMedico, idEspecialidad) {
  contar(await buscarOCrear(
    'SELECT id FROM medico_especialidad WHERE id_medico = ? AND id_especialidad = ?', [idMedico, idEspecialidad],
    'INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES (?, ?)', [idMedico, idEspecialidad],
  ));
}

async function agenda({ medico, sede, esp, dia, entrada, salida }) {
  const f = fecha(dia);
  return contar(await buscarOCrear(
    'SELECT id FROM agenda WHERE id_medico = ? AND id_sede = ? AND id_especialidad = ? AND fecha = ? AND hora_entrada = ?',
    [medico, sede, esp, f, entrada],
    'INSERT INTO agenda (hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede) VALUES (?, ?, ?, ?, ?, ?)',
    [entrada, salida, f, medico, esp, sede],
  ));
}

async function turno({ idAgenda, dia, hora, paciente, cobertura, estado, nota }) {
  const f = fecha(dia);
  return contar(await buscarOCrear(
    'SELECT id FROM turno WHERE id_agenda = ? AND fecha = ? AND hora = ? AND id_paciente = ?',
    [idAgenda, f, hora, paciente],
    'INSERT INTO turno (nota, id_agenda, fecha, hora, id_paciente, id_cobertura, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nota, idAgenda, f, hora, paciente, cobertura, estado],
  ));
}

async function historial({ idTurno, medico, paciente, diagnostico, tratamiento, observaciones }) {
  contar(await buscarOCrear(
    'SELECT id FROM historial_clinico WHERE id_turno = ?', [idTurno],
    `INSERT INTO historial_clinico (id_turno, id_medico, id_paciente, diagnostico, tratamiento, observaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idTurno, medico, paciente, diagnostico, tratamiento, observaciones],
  ));
}

async function notificacion(idUsuario, tipo, mensaje, leida = 0) {
  contar(await buscarOCrear(
    'SELECT id FROM notificacion WHERE id_usuario = ? AND tipo = ? AND mensaje = ?', [idUsuario, tipo, mensaje],
    'INSERT INTO notificacion (id_usuario, tipo, mensaje, leida) VALUES (?, ?, ?, ?)', [idUsuario, tipo, mensaje, leida],
  ));
}

function ddmmaaaa(f) {
  const [a, m, d] = f.split('-');
  return `${d}/${m}/${a}`;
}

async function main() {
  const [cob] = await pool.query('SELECT id FROM cobertura WHERE activo = 1 ORDER BY id');
  const [sedes] = await pool.query('SELECT id FROM sede WHERE id IN (?, ?) AND activo = 1', [SEDE_CENTRO, SEDE_SUR]);
  if (cob.length < 2 || sedes.length < 2) {
    throw new Error('Se necesitan al menos 2 coberturas activas y las sedes 1 y 6 activas');
  }
  const [COB_A, COB_B] = [cob[0].id, cob[1].id];

  const hash = await bcrypt.hash(PASSWORD, 10);

  const trauma = await especialidad('Traumatologia');
  const cardio = await especialidad('Cardiologia');
  const pedia = await especialidad('Pediatria');
  const derma = await especialidad('Dermatologia');

  const admin = await usuario({ apellido: 'Seed', nombre: 'Admin', nacimiento: '1985-03-10', rol: 'admin', email: 'seed.admin@clinica.com', telefono: '1155550001', dni: '30000001' }, hash);
  const opCentro = await usuario({ apellido: 'Diaz', nombre: 'Marta', nacimiento: '1988-06-21', rol: 'operador', email: 'seed.op.centro@clinica.com', telefono: '1155550002', dni: '30000002', id_sede: SEDE_CENTRO }, hash);
  const opSur = await usuario({ apellido: 'Suarez', nombre: 'Pablo', nacimiento: '1990-09-02', rol: 'operador', email: 'seed.op.sur@clinica.com', telefono: '1155550003', dni: '30000003', id_sede: SEDE_SUR }, hash);

  const laura = await usuario({ apellido: 'Martinez', nombre: 'Laura', nacimiento: '1978-01-15', rol: 'medico', email: 'seed.laura@clinica.com', telefono: '1155550011', dni: '30000011', id_sede: SEDE_CENTRO }, hash);
  const carlos = await usuario({ apellido: 'Rios', nombre: 'Carlos', nacimiento: '1975-11-30', rol: 'medico', email: 'seed.carlos@clinica.com', telefono: '1155550012', dni: '30000012', id_sede: SEDE_SUR }, hash);
  const sofia = await usuario({ apellido: 'Herrera', nombre: 'Sofia', nacimiento: '1983-05-08', rol: 'medico', email: 'seed.sofia@clinica.com', telefono: '1155550013', dni: '30000013', id_sede: SEDE_CENTRO }, hash);

  const p1 = await usuario({ apellido: 'Fernandez', nombre: 'Lucia', nacimiento: '1995-04-12', rol: 'paciente', email: 'seed.lucia@gmail.com', telefono: '1155550021', dni: '30000021', id_cobertura: COB_A }, hash);
  const p2 = await usuario({ apellido: 'Gomez', nombre: 'Martin', nacimiento: '1989-12-03', rol: 'paciente', email: 'seed.martin@gmail.com', telefono: '1155550022', dni: '30000022', id_cobertura: COB_B }, hash);
  const p3 = await usuario({ apellido: 'Torres', nombre: 'Valentina', nacimiento: '2001-07-25', rol: 'paciente', email: 'seed.valentina@gmail.com', telefono: '1155550023', dni: '30000023', id_cobertura: COB_A }, hash);

  const [[ana]] = await pool.query("SELECT id FROM usuario WHERE dni = '20111222' AND rol = 'medico'");
  const medicoExistente = ana ? ana.id : null;

  await medicoEspecialidad(laura, cardio);
  await medicoEspecialidad(carlos, pedia);
  await medicoEspecialidad(sofia, cardio);
  await medicoEspecialidad(sofia, derma);
  if (medicoExistente) {
    await medicoEspecialidad(medicoExistente, trauma);
  }

  const aLauraD1 = await agenda({ medico: laura, sede: SEDE_CENTRO, esp: cardio, dia: 1, entrada: '09:00', salida: '13:00' });
  await agenda({ medico: laura, sede: SEDE_CENTRO, esp: cardio, dia: 2, entrada: '14:00', salida: '18:00' });
  const aLauraPasada = await agenda({ medico: laura, sede: SEDE_CENTRO, esp: cardio, dia: -3, entrada: '09:00', salida: '12:00' });

  const aCarlosD1 = await agenda({ medico: carlos, sede: SEDE_SUR, esp: pedia, dia: 1, entrada: '10:00', salida: '14:00' });
  const aCarlosD3 = await agenda({ medico: carlos, sede: SEDE_SUR, esp: pedia, dia: 3, entrada: '08:00', salida: '12:00' });
  const aCarlosPasada = await agenda({ medico: carlos, sede: SEDE_SUR, esp: pedia, dia: -5, entrada: '10:00', salida: '13:00' });

  // Sofia atiende en dos sedes el mismo dia (medico en mas de una sede)
  await agenda({ medico: sofia, sede: SEDE_CENTRO, esp: cardio, dia: 2, entrada: '09:00', salida: '12:00' });
  const aSofiaSur = await agenda({ medico: sofia, sede: SEDE_SUR, esp: derma, dia: 2, entrada: '14:00', salida: '17:00' });
  await agenda({ medico: sofia, sede: SEDE_SUR, esp: derma, dia: 4, entrada: '09:00', salida: '12:00' });
  const aSofiaPasada = await agenda({ medico: sofia, sede: SEDE_CENTRO, esp: cardio, dia: -2, entrada: '09:00', salida: '11:00' });

  let aAnaD1 = null;
  if (medicoExistente) {
    aAnaD1 = await agenda({ medico: medicoExistente, sede: SEDE_CENTRO, esp: trauma, dia: 1, entrada: '08:00', salida: '12:00' });
    await agenda({ medico: medicoExistente, sede: SEDE_CENTRO, esp: trauma, dia: 3, entrada: '15:00', salida: '19:00' });
  }

  // Turnos confirmados
  const tConf1 = await turno({ idAgenda: aLauraD1, dia: 1, hora: '10:00', paciente: p1, cobertura: COB_A, estado: 'confirmado', nota: 'Control cardiologico anual' });
  const tConf2 = await turno({ idAgenda: aLauraD1, dia: 1, hora: '10:30', paciente: p2, cobertura: COB_B, estado: 'confirmado', nota: 'Dolor en el pecho al correr' });
  const tConf3 = await turno({ idAgenda: aCarlosD1, dia: 1, hora: '11:00', paciente: p3, cobertura: COB_A, estado: 'confirmado', nota: 'Consulta pediatrica' });
  const tConf4 = await turno({ idAgenda: aSofiaSur, dia: 2, hora: '15:00', paciente: p1, cobertura: COB_A, estado: 'confirmado', nota: 'Revision de lunares' });
  let tConf5 = null;
  if (aAnaD1) {
    tConf5 = await turno({ idAgenda: aAnaD1, dia: 1, hora: '09:00', paciente: p2, cobertura: COB_B, estado: 'confirmado', nota: 'Dolor de rodilla' });
  }

  // Turnos cancelados
  const tCanc1 = await turno({ idAgenda: aLauraD1, dia: 1, hora: '11:30', paciente: p3, cobertura: COB_A, estado: 'cancelado', nota: 'Consulta cancelada por el paciente' });
  const tCanc2 = await turno({ idAgenda: aCarlosD3, dia: 3, hora: '09:00', paciente: p1, cobertura: COB_A, estado: 'cancelado', nota: 'Control de rutina' });

  // Turnos atendidos con historial clinico
  const tAt1 = await turno({ idAgenda: aLauraPasada, dia: -3, hora: '10:00', paciente: p1, cobertura: COB_A, estado: 'atendido', nota: 'Palpitaciones ocasionales' });
  await historial({ idTurno: tAt1, medico: laura, paciente: p1, diagnostico: 'Taquicardia sinusal leve', tratamiento: 'Reducir cafeina y control en 30 dias', observaciones: 'Electrocardiograma normal' });
  const tAt2 = await turno({ idAgenda: aCarlosPasada, dia: -5, hora: '11:00', paciente: p2, cobertura: COB_B, estado: 'atendido', nota: 'Control de crecimiento' });
  await historial({ idTurno: tAt2, medico: carlos, paciente: p2, diagnostico: 'Desarrollo normal para la edad', tratamiento: 'Sin tratamiento', observaciones: 'Vacunas al dia' });
  const tAt3 = await turno({ idAgenda: aSofiaPasada, dia: -2, hora: '09:30', paciente: p3, cobertura: COB_A, estado: 'atendido', nota: 'Soplo detectado en control escolar' });
  await historial({ idTurno: tAt3, medico: sofia, paciente: p3, diagnostico: 'Soplo funcional inocente', tratamiento: 'Sin tratamiento', observaciones: 'Control anual' });

  // Notificaciones (algunas sin leer para probar el contador)
  const conf = (id, f, h) => `Tu turno del ${ddmmaaaa(fecha(f))} a las ${h} fue confirmado.`;
  await notificacion(p1, 'turno_confirmado', conf(0, 1, '10:00'));
  await notificacion(p2, 'turno_confirmado', conf(0, 1, '10:30'));
  await notificacion(p3, 'turno_confirmado', conf(0, 1, '11:00'));
  await notificacion(p1, 'turno_confirmado', conf(0, 2, '15:00'));
  await notificacion(laura, 'turno_confirmado', `Nuevo turno el ${ddmmaaaa(fecha(1))} a las 10:00 con Lucia Fernandez.`);
  await notificacion(laura, 'turno_confirmado', `Nuevo turno el ${ddmmaaaa(fecha(1))} a las 10:30 con Martin Gomez.`);
  await notificacion(carlos, 'turno_confirmado', `Nuevo turno el ${ddmmaaaa(fecha(1))} a las 11:00 con Valentina Torres.`);
  await notificacion(p3, 'turno_cancelado', `Cancelaste tu turno del ${ddmmaaaa(fecha(1))} a las 11:30.`, 1);
  await notificacion(p1, 'turno_cancelado', `Cancelaste tu turno del ${ddmmaaaa(fecha(3))} a las 09:00.`);
  await notificacion(p1, 'turno_atendido', `Tu turno del ${ddmmaaaa(fecha(-3))} fue atendido.`);
  await notificacion(p3, 'turno_atendido', `Tu turno del ${ddmmaaaa(fecha(-2))} fue atendido.`);


  console.log(`Seed completo. Registros creados: ${stats.creados}, ya existentes: ${stats.existentes}.`);
}

try {
  await main();
} catch (error) {
  console.error('Error en el seed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
