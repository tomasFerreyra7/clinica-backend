import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { listar } from '../controllers/auditoria.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('admin'));

router.get('/', listar);

export default router;
