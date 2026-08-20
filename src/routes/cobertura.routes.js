import { Router } from 'express';
import {
  listarCoberturas,
  obtenerCobertura,
  crearCobertura,
  modificarCobertura,
  eliminarCobertura,
} from '../controllers/cobertura.controller.js';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';

const router = Router();

// Publico: usado en el registro de pacientes (semana 1)
router.get('/', listarCoberturas);

router.get('/:id', verificarToken, verificarRol('admin'), obtenerCobertura);
router.post('/', verificarToken, verificarRol('admin'), crearCobertura);
router.put('/:id', verificarToken, verificarRol('admin'), modificarCobertura);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarCobertura);

export default router;
