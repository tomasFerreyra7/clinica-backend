import pool from '../database/db.js';

export class ErrorServicio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

const MAX_RESULTADOS = 50;

function formatearFecha(valor) {
  if (valor instanceof Date) {
    const mm = String(valor.getMonth() + 1).padStart(2, '0');
    const dd = String(valor.getDate()).padStart(2, '0');
    return `${valor.getFullYear()}-${mm}-${dd}`;
  }
  return valor;
}

function escaparLike(texto) {
  return texto.replace(/[|%_]/g, (c) => `|${c}`);
}

function leerFiltro(valor) {
  if (valor === undefined || valor === null) {
    return null;
  }
  if (typeof valor !== 'string') {
    throw new ErrorServicio(400, 'Los filtros deben enviarse una sola vez y como texto');
  }
  const limpio = valor.trim();
  return limpio === '' ? null : limpio;
}

export async function buscarPacientes({ dni, apellido } = {}) {
  const dniFiltro = leerFiltro(dni);
  const apellidoFiltro = leerFiltro(apellido);

  if (dniFiltro === null && apellidoFiltro === null) {
    throw new ErrorServicio(400, 'Debe indicar dni o apellido para buscar');
  }
  if (dniFiltro !== null && !/^\d{1,8}$/.test(dniFiltro)) {
    throw new ErrorServicio(400, 'El dni debe contener solo numeros (maximo 8 digitos)');
  }
  if (apellidoFiltro !== null && (apellidoFiltro.length < 2 || apellidoFiltro.length > 30)) {
    throw new ErrorServicio(400, 'El apellido debe tener entre 2 y 30 caracteres');
  }

  const condiciones = ["u.rol = 'paciente'"];
  const valores = [];
  if (dniFiltro !== null) {
    condiciones.push("u.dni LIKE ? ESCAPE '|'");
    valores.push(`${escaparLike(dniFiltro)}%`);
  }
  if (apellidoFiltro !== null) {
    condiciones.push("u.apellido LIKE ? ESCAPE '|'");
    valores.push(`${escaparLike(apellidoFiltro)}%`);
  }

  const [filas] = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.dni, u.fecha_nacimiento, u.id_cobertura,
            c.nombre AS cobertura_nombre
     FROM usuario u
     LEFT JOIN cobertura c ON c.id = u.id_cobertura
     WHERE ${condiciones.join(' AND ')}
     ORDER BY u.apellido, u.nombre
     LIMIT ${MAX_RESULTADOS}`,
    valores
  );

  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    apellido: f.apellido,
    dni: f.dni,
    fecha_nacimiento: formatearFecha(f.fecha_nacimiento),
    id_cobertura: f.id_cobertura,
    cobertura_nombre: f.cobertura_nombre,
  }));
}
