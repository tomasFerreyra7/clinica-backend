import pool from '../database/db.js';

export class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function validarIdOpcional(valor, nombreCampo) {
  if (valor === undefined || valor === '') {
    return null;
  }
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ErrorServicio(400, `${nombreCampo} debe ser un numero entero positivo`);
  }
  return n;
}

export async function listarMedicos({ id_especialidad, id_sede }) {
  const idEspecialidad = validarIdOpcional(id_especialidad, 'id_especialidad');
  const idSede = validarIdOpcional(id_sede, 'id_sede');

  let sql = `SELECT u.id, u.nombre, u.apellido
             FROM usuario u
             WHERE u.rol = 'medico'`;
  const params = [];

  if (idEspecialidad !== null) {
    sql += ` AND EXISTS (SELECT 1 FROM medico_especialidad me
                         WHERE me.id_medico = u.id AND me.id_especialidad = ?)`;
    params.push(idEspecialidad);
  }

  // Sede del medico o sede con agenda cargada (un medico puede atender en varias sedes)
  if (idSede !== null) {
    sql += ` AND (u.id_sede = ? OR EXISTS (SELECT 1 FROM agenda a
                                           WHERE a.id_medico = u.id AND a.id_sede = ?`;
    params.push(idSede, idSede);
    if (idEspecialidad !== null) {
      sql += ' AND a.id_especialidad = ?';
      params.push(idEspecialidad);
    }
    sql += '))';
  }

  sql += ' ORDER BY u.apellido, u.nombre';

  const [medicos] = await pool.query(sql, params);
  if (medicos.length === 0) {
    return [];
  }

  const [especialidades] = await pool.query(
    `SELECT me.id_medico, e.id, e.descripcion
     FROM medico_especialidad me
     JOIN especialidad e ON e.id = me.id_especialidad
     WHERE me.id_medico IN (?)
     ORDER BY e.descripcion`,
    [medicos.map((m) => m.id)]
  );

  return medicos.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    apellido: m.apellido,
    especialidades: especialidades
      .filter((e) => e.id_medico === m.id)
      .map((e) => ({ id: e.id, descripcion: e.descripcion })),
  }));
}
