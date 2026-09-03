import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { listar } from '../controllers/auditoria.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('admin'));

/**
 * @swagger
 * /auditoria:
 *   get:
 *     tags: [Auditoria]
 *     summary: Listar logs de auditoria
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_usuario
 *         schema:
 *           type: integer
 *       - in: query
 *         name: entidad
 *         schema:
 *           type: string
 *           enum: [usuario, cobertura, especialidad, sede]
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *         description: Requiere tambien 'hasta'
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *         description: Requiere tambien 'desde'
 *     responses:
 *       200:
 *         description: Lista de logs de auditoria
 *       400:
 *         description: Filtros invalidos
 */
router.get('/', listar);

export default router;
