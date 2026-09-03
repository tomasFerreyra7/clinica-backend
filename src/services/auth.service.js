import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/db.js';
import { registrarAuditoria } from '../utils/auditoria.js';

const SALT_ROUNDS = 10;

class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

export async function registrarPaciente({ nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono }) {
  if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !id_cobertura) {
    throw new ErrorServicio(400, 'Faltan campos obligatorios (nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura)');
  }

  const [coberturas] = await pool.query('SELECT id FROM cobertura WHERE id = ? AND activo = 1', [id_cobertura]);
  if (coberturas.length === 0) {
    throw new ErrorServicio(400, 'La cobertura indicada no existe');
  }

  const [existentes] = await pool.query('SELECT id FROM usuario WHERE dni = ? OR email = ?', [dni, email]);
  if (existentes.length > 0) {
    throw new ErrorServicio(409, 'Ya existe un usuario con ese DNI o email');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [resultado] = await pool.query(
    `INSERT INTO usuario (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura)
     VALUES (?, ?, ?, ?, 'paciente', ?, ?, ?, NULL, ?)`,
    [apellido, nombre, fecha_nacimiento, passwordHash, email, telefono || '', dni, id_cobertura]
  );

  await registrarAuditoria({
    idUsuario: resultado.insertId,
    accion: 'ALTA',
    entidad: 'usuario',
    detalle: 'Paciente registrado mediante el endpoint publico',
  });

  return { id: resultado.insertId, nombre, apellido, dni, email, rol: 'paciente' };
}

export async function autenticar({ dni, password }) {
  if (!dni || !password) {
    throw new ErrorServicio(400, 'Debe indicar dni y password');
  }

  const [usuarios] = await pool.query('SELECT * FROM usuario WHERE dni = ?', [dni]);
  if (usuarios.length === 0) {
    throw new ErrorServicio(401, 'Credenciales invalidas');
  }

  const usuario = usuarios[0];
  const passwordValida = await bcrypt.compare(password, usuario.password);
  if (!passwordValida) {
    throw new ErrorServicio(401, 'Credenciales invalidas');
  }

  const payload = { id: usuario.id, rol: usuario.rol, id_sede: usuario.id_sede };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });

  return { token, usuario: payload };
}

export async function obtenerPerfil(id) {
  const [usuarios] = await pool.query(
    'SELECT id, nombre, apellido, dni, email, telefono, fecha_nacimiento, rol, id_sede, id_cobertura FROM usuario WHERE id = ?',
    [id]
  );

  if (usuarios.length === 0) {
    throw new ErrorServicio(404, 'Usuario no encontrado');
  }

  return usuarios[0];
}

export { ErrorServicio };
