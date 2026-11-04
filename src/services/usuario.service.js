import bcrypt from 'bcrypt';
import pool from '../database/db.js';
import { registrarAuditoria } from '../utils/auditoria.js';
import { validarEnteroPositivo, validarFecha, validarTexto } from '../utils/validacion.js';

const SALT_ROUNDS = 10;
const ROLES = ['admin', 'operador', 'medico', 'paciente'];
const ROLES_ALTA = ['operador', 'medico', 'admin'];
const ROLES_CON_SEDE = ['operador', 'medico'];
const LIMITE_POR_DEFECTO = 10;
const LIMITE_MAXIMO = 50;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.apellido, u.dni, u.email, u.telefono,
         DATE_FORMAT(u.fecha_nacimiento, '%Y-%m-%d') AS fecha_nacimiento,
         u.rol, u.id_sede, s.nombre AS sede, u.id_cobertura, c.nombre AS cobertura
  FROM usuario u
  LEFT JOIN sede s ON s.id = u.id_sede
  LEFT JOIN cobertura c ON c.id = u.id_cobertura`;

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

// ---------- Validadores de campos (compartidos con auth.service) ----------

function estaPresente(valor) {
  return valor !== undefined && valor !== null;
}

function validarEntero(valor, nombreCampo) {
  let numero;
  try {
    numero = validarEnteroPositivo(valor, nombreCampo);
  } catch (error) {
    throw new ErrorServicio(400, error.message);
  }
  if (!Number.isSafeInteger(numero)) {
    throw new ErrorServicio(400, `${nombreCampo} debe ser un numero entero positivo`);
  }
  return numero;
}

function validarCampoTexto(valor, nombreCampo, maxLength) {
  const error = validarTexto(valor, nombreCampo, { maxLength });
  if (error) {
    throw new ErrorServicio(400, error);
  }
  return valor.trim();
}

function validarDigitos(valor, nombreCampo, minimo, maximo) {
  if (!estaPresente(valor) || valor === '') {
    throw new ErrorServicio(400, `El campo ${nombreCampo} es obligatorio`);
  }
  if (typeof valor !== 'string' && typeof valor !== 'number') {
    throw new ErrorServicio(400, `El campo ${nombreCampo} debe ser de tipo texto`);
  }
  const limpio = String(valor).trim();
  if (!/^\d+$/.test(limpio) || limpio.length < minimo || limpio.length > maximo) {
    throw new ErrorServicio(
      400,
      `El campo ${nombreCampo} debe tener solo digitos, entre ${minimo} y ${maximo}`
    );
  }
  return limpio;
}

export function validarDni(valor) {
  return validarDigitos(valor, 'dni', 7, 8);
}

export function validarTelefono(valor) {
  return validarDigitos(valor, 'telefono', 6, 10);
}

export function validarEmail(valor) {
  const email = validarCampoTexto(valor, 'email', 30);
  if (!REGEX_EMAIL.test(email)) {
    throw new ErrorServicio(400, 'El campo email debe tener un formato valido');
  }
  return email;
}

export function validarPassword(valor) {
  if (!estaPresente(valor) || valor === '') {
    throw new ErrorServicio(400, 'El campo password es obligatorio');
  }
  if (typeof valor !== 'string') {
    throw new ErrorServicio(400, 'El campo password debe ser de tipo texto');
  }
  if (!valor.trim()) {
    throw new ErrorServicio(400, 'El campo password es obligatorio');
  }
  if (valor.length < 6) {
    throw new ErrorServicio(400, 'El campo password debe tener al menos 6 caracteres');
  }
  return valor;
}

function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function validarFechaNacimiento(valor) {
  let fecha;
  try {
    fecha = validarFecha(valor, 'fecha_nacimiento');
  } catch (error) {
    throw new ErrorServicio(400, error.message);
  }
  if (fecha > fechaDeHoy()) {
    throw new ErrorServicio(400, 'fecha_nacimiento no puede ser posterior a hoy');
  }
  return fecha;
}

export function validarIdCobertura(valor) {
  return validarEntero(valor, 'id_cobertura');
}

function validarEspecialidades(valor) {
  if (!Array.isArray(valor) || valor.length === 0) {
    throw new ErrorServicio(400, 'especialidades debe ser una lista con al menos una especialidad');
  }
  const ids = valor.map((id) => {
    if (typeof id !== 'number' && typeof id !== 'string') {
      throw new ErrorServicio(400, 'especialidades debe contener ids enteros positivos');
    }
    return validarEntero(id, 'Cada especialidad');
  });
  if (new Set(ids).size !== ids.length) {
    throw new ErrorServicio(400, 'especialidades no puede tener ids repetidos');
  }
  return ids;
}

function validarDatosPersonales(body) {
  return {
    nombre: validarCampoTexto(body.nombre, 'nombre', 30),
    apellido: validarCampoTexto(body.apellido, 'apellido', 30),
    dni: validarDni(body.dni),
    email: validarEmail(body.email),
    telefono: validarTelefono(body.telefono),
    fecha_nacimiento: validarFechaNacimiento(body.fecha_nacimiento),
  };
}

/**
 * Aplica la tabla "Reglas por rol": que campos lleva cada rol.
 * Devuelve id_sede, id_cobertura y especialidades normalizados (null si no corresponden).
 */
function validarCamposPorRol(rol, body) {
  const resultado = { id_sede: null, id_cobertura: null, especialidades: null };

  if (ROLES_CON_SEDE.includes(rol)) {
    if (!estaPresente(body.id_sede)) {
      throw new ErrorServicio(400, `La sede es obligatoria para el rol ${rol}`);
    }
    resultado.id_sede = validarEntero(body.id_sede, 'id_sede');
  } else if (estaPresente(body.id_sede)) {
    throw new ErrorServicio(
      400,
      rol === 'admin' ? 'El administrador no tiene sede' : 'El paciente no tiene sede'
    );
  }

  if (rol === 'medico') {
    if (!estaPresente(body.especialidades)) {
      throw new ErrorServicio(400, 'Las especialidades son obligatorias para el medico');
    }
    resultado.especialidades = validarEspecialidades(body.especialidades);
  } else if (estaPresente(body.especialidades)) {
    throw new ErrorServicio(400, 'Solo el medico tiene especialidades');
  }

  if (rol === 'paciente') {
    if (!estaPresente(body.id_cobertura)) {
      throw new ErrorServicio(400, 'La cobertura es obligatoria para el paciente');
    }
    resultado.id_cobertura = validarIdCobertura(body.id_cobertura);
  } else if (estaPresente(body.id_cobertura)) {
    throw new ErrorServicio(400, 'Solo el paciente tiene cobertura');
  }

  return resultado;
}

// ---------- Verificaciones contra la base ----------

async function verificarSedeActiva(idSede) {
  const [filas] = await pool.query('SELECT id FROM sede WHERE id = ? AND activo = 1', [idSede]);
  if (filas.length === 0) {
    throw new ErrorServicio(400, 'La sede indicada no existe');
  }
}

export async function verificarCoberturaActiva(idCobertura) {
  const [filas] = await pool.query(
    'SELECT id FROM cobertura WHERE id = ? AND activo = 1',
    [idCobertura]
  );
  if (filas.length === 0) {
    throw new ErrorServicio(400, 'La cobertura indicada no existe');
  }
}

async function verificarEspecialidadesExistentes(ids) {
  const [filas] = await pool.query('SELECT id FROM especialidad WHERE id IN (?)', [ids]);
  if (filas.length !== ids.length) {
    throw new ErrorServicio(400, 'Alguna de las especialidades indicadas no existe');
  }
}

async function verificarReferencias({ id_sede, id_cobertura, especialidades }) {
  if (id_sede !== null) {
    await verificarSedeActiva(id_sede);
  }
  if (id_cobertura !== null) {
    await verificarCoberturaActiva(id_cobertura);
  }
  if (especialidades !== null) {
    await verificarEspecialidadesExistentes(especialidades);
  }
}

async function verificarDniEmailDisponibles(dni, email, excluirId = 0) {
  const [filas] = await pool.query(
    'SELECT id FROM usuario WHERE (dni = ? OR email = ?) AND id <> ? LIMIT 1',
    [dni, email, excluirId]
  );
  if (filas.length > 0) {
    throw new ErrorServicio(409, 'Ya existe un usuario con ese DNI o email');
  }
}

export async function verificarEmailDisponible(email, excluirId) {
  const [filas] = await pool.query(
    'SELECT id FROM usuario WHERE email = ? AND id <> ? LIMIT 1',
    [email, excluirId]
  );
  if (filas.length > 0) {
    throw new ErrorServicio(409, 'Ya existe un usuario con ese email');
  }
}

async function verificarEspecialidadesSinAgenda(idMedico, especialidades) {
  const [filas] = await pool.query(
    `SELECT e.descripcion
     FROM agenda a
     JOIN especialidad e ON e.id = a.id_especialidad
     WHERE a.id_medico = ? AND a.fecha >= CURDATE() AND a.id_especialidad NOT IN (?)
     ORDER BY e.descripcion
     LIMIT 1`,
    [idMedico, especialidades]
  );
  if (filas.length > 0) {
    throw new ErrorServicio(
      409,
      `No se puede quitar la especialidad ${filas[0].descripcion} porque el medico tiene agenda con ella`
    );
  }
}

export function hashearPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function insertarEspecialidades(conexion, idMedico, especialidades) {
  const filas = especialidades.map((idEspecialidad) => [idMedico, idEspecialidad]);
  await conexion.query(
    'INSERT INTO medico_especialidad (id_medico, id_especialidad) VALUES ?',
    [filas]
  );
}

async function ejecutarEnTransaccion(operacion) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await operacion(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ---------- Listado ----------

function leerParametro(query, nombre) {
  const valor = query[nombre];
  if (valor === undefined) {
    return undefined;
  }
  if (typeof valor !== 'string') {
    throw new ErrorServicio(400, `${nombre} no es valido`);
  }
  const limpio = valor.trim();
  return limpio === '' ? undefined : limpio;
}

function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}

export function obtenerFiltrosUsuario(query = {}) {
  const filtros = [];
  const parametros = [];

  for (const campo of ['nombre', 'apellido']) {
    const valor = leerParametro(query, campo);
    if (valor !== undefined) {
      if (valor.length > 30) {
        throw new ErrorServicio(400, `${campo} no puede superar los 30 caracteres`);
      }
      filtros.push(`u.${campo} LIKE ?`);
      parametros.push(`%${escaparLike(valor)}%`);
    }
  }

  const rol = leerParametro(query, 'rol');
  if (rol !== undefined) {
    if (!ROLES.includes(rol)) {
      throw new ErrorServicio(400, 'rol debe ser admin, operador, medico o paciente');
    }
    filtros.push('u.rol = ?');
    parametros.push(rol);
  }

  const idSede = leerParametro(query, 'id_sede');
  if (idSede !== undefined) {
    filtros.push('u.id_sede = ?');
    parametros.push(validarEntero(idSede, 'id_sede'));
  }

  const paginaTexto = leerParametro(query, 'pagina');
  const pagina = paginaTexto === undefined ? 1 : validarEntero(paginaTexto, 'pagina');

  const limiteTexto = leerParametro(query, 'limite');
  const limite = limiteTexto === undefined
    ? LIMITE_POR_DEFECTO
    : validarEntero(limiteTexto, 'limite');
  if (limite > LIMITE_MAXIMO) {
    throw new ErrorServicio(400, `limite no puede ser mayor a ${LIMITE_MAXIMO}`);
  }

  return { filtros, parametros, pagina, limite };
}

export async function listarUsuarios(query = {}) {
  const { filtros, parametros, pagina, limite } = obtenerFiltrosUsuario(query);
  const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM usuario u ${where}`,
    parametros
  );

  const [items] = await pool.query(
    `${SELECT_USUARIO}
     ${where}
     ORDER BY u.apellido ASC, u.nombre ASC, u.id ASC
     LIMIT ? OFFSET ?`,
    [...parametros, limite, (pagina - 1) * limite]
  );

  return {
    items,
    total,
    pagina,
    limite,
    total_paginas: Math.ceil(total / limite),
  };
}

// ---------- Detalle ----------

export async function obtenerUsuario(id) {
  const idNum = validarEntero(id, 'id');

  const [usuarios] = await pool.query(`${SELECT_USUARIO} WHERE u.id = ?`, [idNum]);
  if (usuarios.length === 0) {
    throw new ErrorServicio(404, 'Usuario no encontrado');
  }

  const [especialidades] = await pool.query(
    `SELECT e.id, e.descripcion
     FROM medico_especialidad me
     JOIN especialidad e ON e.id = me.id_especialidad
     WHERE me.id_medico = ?
     ORDER BY e.descripcion`,
    [idNum]
  );

  return { ...usuarios[0], especialidades };
}

// ---------- Alta ----------

export async function crearUsuario(body = {}, idAdmin) {
  const datos = validarDatosPersonales(body);
  const password = validarPassword(body.password);

  if (body.rol === 'paciente') {
    throw new ErrorServicio(400, 'Los pacientes se registran con POST /auth/registro');
  }
  if (!ROLES_ALTA.includes(body.rol)) {
    throw new ErrorServicio(400, 'El rol debe ser operador, medico o admin');
  }
  const { rol } = body;

  const porRol = validarCamposPorRol(rol, body);
  await verificarReferencias(porRol);
  await verificarDniEmailDisponibles(datos.dni, datos.email);

  const passwordHash = await hashearPassword(password);

  const idUsuario = await ejecutarEnTransaccion(async (conexion) => {
    const [resultado] = await conexion.query(
      `INSERT INTO usuario
        (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        datos.apellido,
        datos.nombre,
        datos.fecha_nacimiento,
        passwordHash,
        rol,
        datos.email,
        datos.telefono,
        datos.dni,
        porRol.id_sede,
      ]
    );
    if (porRol.especialidades) {
      await insertarEspecialidades(conexion, resultado.insertId, porRol.especialidades);
    }
    return resultado.insertId;
  });

  await registrarAuditoria({
    idUsuario: idAdmin,
    accion: 'ALTA',
    entidad: 'usuario',
    detalle: `Se dio de alta el usuario ${idUsuario} con rol ${rol}`,
  });

  return obtenerUsuario(idUsuario);
}

// ---------- Edicion ----------

export async function actualizarUsuario(id, body = {}, idAdmin) {
  const idNum = validarEntero(id, 'id');

  const [existentes] = await pool.query('SELECT id, rol FROM usuario WHERE id = ?', [idNum]);
  if (existentes.length === 0) {
    throw new ErrorServicio(404, 'Usuario no encontrado');
  }
  const { rol } = existentes[0];

  if (estaPresente(body.rol) && body.rol !== rol) {
    throw new ErrorServicio(400, 'No se puede modificar el rol del usuario');
  }

  const datos = validarDatosPersonales(body);
  const password = estaPresente(body.password) ? validarPassword(body.password) : null;
  const porRol = validarCamposPorRol(rol, body);

  await verificarReferencias(porRol);
  await verificarDniEmailDisponibles(datos.dni, datos.email, idNum);
  if (porRol.especialidades) {
    await verificarEspecialidadesSinAgenda(idNum, porRol.especialidades);
  }

  const campos = [
    'nombre = ?', 'apellido = ?', 'dni = ?', 'email = ?', 'telefono = ?',
    'fecha_nacimiento = ?', 'id_sede = ?', 'id_cobertura = ?',
  ];
  const valores = [
    datos.nombre, datos.apellido, datos.dni, datos.email, datos.telefono,
    datos.fecha_nacimiento, porRol.id_sede, porRol.id_cobertura,
  ];
  if (password) {
    campos.push('password = ?');
    valores.push(await hashearPassword(password));
  }

  await ejecutarEnTransaccion(async (conexion) => {
    await conexion.query(
      `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`,
      [...valores, idNum]
    );
    if (porRol.especialidades) {
      await conexion.query('DELETE FROM medico_especialidad WHERE id_medico = ?', [idNum]);
      await insertarEspecialidades(conexion, idNum, porRol.especialidades);
    }
  });

  const sufijo = password ? ' (incluye cambio de contraseña)' : '';
  await registrarAuditoria({
    idUsuario: idAdmin,
    accion: 'MODIFICACION',
    entidad: 'usuario',
    detalle: `Se modifico el usuario ${idNum}${sufijo}`,
  });

  return obtenerUsuario(idNum);
}

export { ErrorServicio };
