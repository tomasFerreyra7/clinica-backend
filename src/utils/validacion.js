const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function validarEnteroPositivo(valor, nombreCampo) {
  if (!/^\d+$/.test(String(valor)) || Number(valor) <= 0) {
    throw new Error(`${nombreCampo} debe ser un numero entero positivo`);
  }
  return Number(valor);
}

export function validarTexto(valor, nombreCampo, { maxLength } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    return `El campo ${nombreCampo} es obligatorio`;
  }
  if (typeof valor !== 'string') {
    return `El campo ${nombreCampo} debe ser de tipo texto`;
  }
  const valorLimpio = valor.trim();
  if (valorLimpio.length === 0) {
    return `El campo ${nombreCampo} es obligatorio`;
  }
  if (maxLength && valorLimpio.length > maxLength) {
    return `El campo ${nombreCampo} no puede superar los ${maxLength} caracteres`;
  }
  return null;
}

/**
 * @param {unknown} valor
 * @param {string} nombreCampo
 * @returns {string}
 */
export function validarFecha(valor, nombreCampo) {
  if (valor === undefined || valor === null || valor === '') {
    throw new Error(`${nombreCampo} es obligatoria`);
  }
  if (typeof valor !== 'string' || !valor.trim()) {
    throw new Error(`${nombreCampo} debe tener formato YYYY-MM-DD valido`);
  }
  const fecha = valor.trim();
  if (!REGEX_FECHA.test(fecha)) {
    throw new Error(`${nombreCampo} debe tener formato YYYY-MM-DD valido`);
  }
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    date.getUTCFullYear() !== anio
    || date.getUTCMonth() !== mes - 1
    || date.getUTCDate() !== dia
  ) {
    throw new Error(`${nombreCampo} debe tener formato YYYY-MM-DD valido`);
  }
  return fecha;
}

/**
 * @param {Record<string, unknown>} query
 * @returns {{ desde: string, hasta: string }}
 */
export function validarRangoFechas(query = {}) {
  const desde = validarFecha(query.desde, 'desde');
  const hasta = validarFecha(query.hasta, 'hasta');
  if (desde > hasta) {
    throw new Error('desde no puede ser posterior a hasta');
  }
  return { desde, hasta };
}
