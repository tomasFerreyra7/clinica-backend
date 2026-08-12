import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/db.js';
import { enviarOk, enviarError } from '../utils/respuesta.js';

const SALT_ROUNDS = 10;

export async function registro(req, res) {
  try {
    const { nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura, telefono } = req.body;

    if (!nombre || !apellido || !dni || !email || !password || !fecha_nacimiento || !id_cobertura) {
      return enviarError(res, 400, 'Faltan campos obligatorios (nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura)');
    }

    // Validar cobertura existente
    const [coberturas] = await pool.query('SELECT id FROM cobertura WHERE id = ?', [id_cobertura]);
    if (coberturas.length === 0) {
      return enviarError(res, 400, 'La cobertura indicada no existe');
    }

    // Validar DNI y email no duplicados
    const [existentes] = await pool.query(
      'SELECT id FROM usuario WHERE dni = ? OR email = ?',
      [dni, email]
    );
    if (existentes.length > 0) {
      return enviarError(res, 409, 'Ya existe un usuario con ese DNI o email');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [resultado] = await pool.query(
      `INSERT INTO usuario (apellido, nombre, fecha_nacimiento, password, rol, email, telefono, dni, id_sede, id_cobertura)
       VALUES (?, ?, ?, ?, 'paciente', ?, ?, ?, NULL, ?)`,
      [apellido, nombre, fecha_nacimiento, passwordHash, email, telefono || '', dni, id_cobertura]
    );

    return enviarOk(res, 201, {
      id: resultado.insertId,
      nombre,
      apellido,
      dni,
      email,
      rol: 'paciente',
    });
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al registrar el usuario');
  }
}

export async function login(req, res) {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      return enviarError(res, 400, 'Debe indicar dni y password');
    }

    const [usuarios] = await pool.query('SELECT * FROM usuario WHERE dni = ?', [dni]);
    if (usuarios.length === 0) {
      return enviarError(res, 401, 'Credenciales invalidas');
    }

    const usuario = usuarios[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return enviarError(res, 401, 'Credenciales invalidas');
    }

    const payload = {
      id: usuario.id,
      rol: usuario.rol,
      id_sede: usuario.id_sede,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    });

    return enviarOk(res, 200, { token, usuario: payload });
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al iniciar sesion');
  }
}

export async function perfil(req, res) {
  try {
    const [usuarios] = await pool.query(
      'SELECT id, nombre, apellido, dni, email, telefono, fecha_nacimiento, rol, id_sede, id_cobertura FROM usuario WHERE id = ?',
      [req.usuario.id]
    );

    if (usuarios.length === 0) {
      return enviarError(res, 404, 'Usuario no encontrado');
    }

    return enviarOk(res, 200, usuarios[0]);
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'Error al obtener el perfil');
  }
}
