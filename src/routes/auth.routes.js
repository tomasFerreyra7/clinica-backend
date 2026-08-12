import { Router } from 'express';
import { registro, login, perfil } from '../controllers/auth.controller.js';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/perfil', verificarToken, verificarRol('paciente', 'operador', 'medico', 'admin'), perfil);

export default router;
