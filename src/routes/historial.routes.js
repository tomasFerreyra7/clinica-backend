import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { crear, listar } from '../controllers/historial.controller.js';

const router = Router();

router.use(verificarToken);

/**
 * @swagger
 * /historial:
 *   post:
 *     tags: [Historial Clinico]
 *     summary: Registrar historial clinico (medico)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_turno, diagnostico, tratamiento]
 *             properties:
 *               id_turno:
 *                 type: integer
 *                 example: 1
 *               diagnostico:
 *                 type: string
 *                 example: Hipertension leve
 *               tratamiento:
 *                 type: string
 *                 example: Dieta baja en sodio
 *               observaciones:
 *                 type: string
 *                 example: Control en 30 dias
 *     responses:
 *       201:
 *         description: Historial registrado
 *       403:
 *         description: Solo medicos pueden registrar
 *       409:
 *         description: Turno no atendido o ya tiene historial
 */
router.post('/', crear);

/**
 * @swagger
 * /historial:
 *   get:
 *     tags: [Historial Clinico]
 *     summary: Listar historiales (paciente ve los suyos, medico los que registro)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de historiales
 *       403:
 *         description: Rol sin permisos
 */
router.get('/', listar);

export default router;
