import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear } from '../controllers/agenda.controller.js';

const router = Router();

router.post('/', verificarToken, verificarRol('operador', 'medico'), crear);

export default router;
