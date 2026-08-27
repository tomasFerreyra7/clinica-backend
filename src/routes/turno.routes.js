import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear } from '../controllers/turno.controller.js';

const router = Router();

router.post('/', verificarToken, verificarRol('paciente', 'operador'), crear);

export default router;
