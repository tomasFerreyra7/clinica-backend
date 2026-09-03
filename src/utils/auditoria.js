import pool from '../database/db.js';

export async function registrarAuditoria({ idUsuario, accion, entidad, detalle }) {
  await pool.query(
    `INSERT INTO log_auditoria
      (id_usuario, accion, entidad, detalle)
     VALUES (?, ?, ?, ?)`,
    [idUsuario, accion, entidad, detalle],
  );
}

