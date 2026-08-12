import { enviarOk, enviarError } from '../utils/respuesta.js';
import { registrarPaciente, autenticar, obtenerPerfil, ErrorServicio } from '../services/auth.service.js';

export async function registro(req, res) {
  try {
    const datos = await registrarPaciente(req.body);
    return enviarOk(res, 201, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al registrar el usuario');
  }
}

export async function login(req, res) {
  try {
    const datos = await autenticar(req.body);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al iniciar sesion');
  }
}

export async function perfil(req, res) {
  try {
    const datos = await obtenerPerfil(req.usuario.id);
    return enviarOk(res, 200, datos);
  } catch (error) {
    if (error instanceof ErrorServicio) {
      return enviarError(res, error.codigo, error.message);
    }
    console.error(error);
    return enviarError(res, 500, 'Error al obtener el perfil');
  }
}
