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

