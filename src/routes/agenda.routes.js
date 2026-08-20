import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear, listar, actualizar, eliminar } from '../controllers/agenda.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('operador', 'medico'));

router.post('/', crear);
router.get('/', listar);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;
