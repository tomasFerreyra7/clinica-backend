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

export async function crearNotificacion(idUsuario, tipo, mensaje) {
  const usuario = validarId(idUsuario, 'id_usuario');
  const tipoNormalizado = validarTexto(tipo, 'tipo');
  const mensajeNormalizado = validarTexto(mensaje, 'mensaje');

  const [resultado] = await pool.query(
    `INSERT INTO notificacion (id_usuario, tipo, mensaje, leida)
		 VALUES (?, ?, ?, 0)`,
    [usuario, tipoNormalizado, mensajeNormalizado],
  );

  return {
    id: resultado.insertId,
    id_usuario: usuario,
    tipo: tipoNormalizado,
    mensaje: mensajeNormalizado,
    leida: 0,
  };
}

export async function listarNotificaciones(idUsuario) {
  const usuario = validarId(idUsuario, 'id_usuario');

  const [filas] = await pool.query(
    `SELECT id, id_usuario, tipo, mensaje, fecha, leida
		 FROM notificacion
		 WHERE id_usuario = ?
		 ORDER BY fecha DESC, id DESC`,
    [usuario],
  );

  return filas;
}

export async function marcarNotificacionLeida(idNotificacion, idUsuario) {
  const notificacion = validarId(idNotificacion, 'id');
  const usuario = validarId(idUsuario, 'id_usuario');

  const [filas] = await pool.query('SELECT id, id_usuario, tipo, mensaje, fecha, leida FROM notificacion WHERE id = ? AND id_usuario = ?', [
    notificacion,
    usuario,
  ]);
  if (filas.length === 0) {
    throw new ErrorServicio(404, 'Notificacion no encontrada');
  }

  await pool.query('UPDATE notificacion SET leida = 1 WHERE id = ? AND id_usuario = ?', [notificacion, usuario]);

  return { ...filas[0], leida: 1 };
}

export { ErrorServicio };

