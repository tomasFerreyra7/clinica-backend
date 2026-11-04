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
 *     summary: Listar historiales (paciente ve los suyos, medico solo los de turnos que atendio el)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_paciente
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtra por paciente. El medico solo obtiene registros de sus propios turnos; el paciente solo puede pedir el suyo.
 *     responses:
 *       200:
 *         description: Lista de historiales con fecha y hora del turno, especialidad, sede y nombres de paciente y medico
 *       400:
 *         description: id_paciente invalido
 *       403:
 *         description: Rol sin permisos o paciente pidiendo el historial de otro
 */
router.get('/', listar);

export default router;
