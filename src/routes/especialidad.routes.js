import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear, listar, actualizar, eliminar } from '../controllers/especialidad.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('admin'));

router.post('/', crear);
router.get('/', listar);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

export default router;
