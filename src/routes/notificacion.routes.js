import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { listar, marcarLeida } from '../controllers/notificacion.controller.js';

const router = Router();

router.use(verificarToken);

router.get('/', listar);
router.patch('/:id/leida', marcarLeida);

export default router;

