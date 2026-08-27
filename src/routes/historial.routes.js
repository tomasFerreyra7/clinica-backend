import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { crear, listar } from '../controllers/historial.controller.js';

const router = Router();

router.use(verificarToken);

router.post('/', crear);
router.get('/', listar);

export default router;

