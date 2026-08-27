import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear, cancelar } from '../controllers/turno.controller.js';

const router = Router();

router.post('/', verificarToken, verificarRol('paciente', 'operador'), crear);
router.patch(
  '/:id/cancelar',
  verificarToken,
  verificarRol('paciente', 'operador', 'medico'),
  cancelar
);

export default router;
