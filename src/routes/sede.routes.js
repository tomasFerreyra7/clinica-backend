import { Router } from 'express';
import {
  listarSedes,
  obtenerSede,
  crearSede,
  modificarSede,
  eliminarSede,
} from '../controllers/sede.controller.js';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verificarToken, verificarRol('admin'), listarSedes);
router.get('/:id', verificarToken, verificarRol('admin'), obtenerSede);
router.post('/', verificarToken, verificarRol('admin'), crearSede);
router.put('/:id', verificarToken, verificarRol('admin'), modificarSede);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarSede);

export default router;
