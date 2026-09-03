import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { listar, marcarLeida } from '../controllers/notificacion.controller.js';

const router = Router();

router.use(verificarToken);

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Listar notificaciones del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/', listar);

/**
 * @swagger
 * /notificaciones/{id}/leida:
 *   patch:
 *     tags: [Notificaciones]
 *     summary: Marcar una notificacion como leida
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificacion marcada como leida
 *       404:
 *         description: Notificacion no encontrada
 */
router.patch('/:id/leida', marcarLeida);

export default router;
