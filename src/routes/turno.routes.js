import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear, cancelar, atender, listarMios, listar } from '../controllers/turno.controller.js';

const router = Router();

router.get('/mios', verificarToken, verificarRol('paciente'), listarMios);
router.get('/', verificarToken, verificarRol('operador', 'medico'), listar);
router.post('/', verificarToken, verificarRol('paciente', 'operador'), crear);
router.patch(
  '/:id/cancelar',
  verificarToken,
  verificarRol('paciente', 'operador', 'medico'),
  cancelar
);
router.patch('/:id/atender', verificarToken, verificarRol('medico'), atender);

export default router;
