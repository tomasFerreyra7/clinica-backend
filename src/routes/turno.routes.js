import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear, cancelar, atender, listarMios, listar } from '../controllers/turno.controller.js';

const router = Router();

/**
 * @swagger
 * /turnos/mios:
 *   get:
 *     tags: [Turnos]
 *     summary: Listar mis turnos (paciente)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de turnos del paciente
 */
router.get('/mios', verificarToken, verificarRol('paciente'), listarMios);

/**
 * @swagger
 * /turnos:
 *   get:
 *     tags: [Turnos]
 *     summary: Listar turnos (operador/medico)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: id_medico
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_sede
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de turnos
 *       400:
 *         description: Filtros invalidos
 */
router.get('/', verificarToken, verificarRol('operador', 'medico'), listar);

/**
 * @swagger
 * /turnos:
 *   post:
 *     tags: [Turnos]
 *     summary: Crear un turno
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_especialidad, id_sede, id_medico, fecha, hora, nota]
 *             properties:
 *               id_especialidad:
 *                 type: integer
 *                 example: 1
 *               id_sede:
 *                 type: integer
 *                 example: 1
 *               id_medico:
 *                 type: integer
 *                 example: 1
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-10"
 *               hora:
 *                 type: string
 *                 example: "09:00"
 *               nota:
 *                 type: string
 *                 example: Control de rutina
 *               id_paciente:
 *                 type: integer
 *                 description: Solo obligatorio para operador
 *     responses:
 *       201:
 *         description: Turno creado
 *       400:
 *         description: Datos invalidos
 *       409:
 *         description: Horario no disponible o solapamiento
 */
router.post('/', verificarToken, verificarRol('paciente', 'operador'), crear);

/**
 * @swagger
 * /turnos/{id}/cancelar:
 *   patch:
 *     tags: [Turnos]
 *     summary: Cancelar un turno
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
 *         description: Turno cancelado
 *       404:
 *         description: Turno no encontrado
 *       409:
 *         description: Solo se pueden cancelar turnos confirmados
 */
router.patch(
  '/:id/cancelar',
  verificarToken,
  verificarRol('paciente', 'operador', 'medico'),
  cancelar
);

/**
 * @swagger
 * /turnos/{id}/atender:
 *   patch:
 *     tags: [Turnos]
 *     summary: Marcar turno como atendido (medico)
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
 *         description: Turno marcado como atendido
 *       403:
 *         description: El turno no pertenece al medico
 *       409:
 *         description: Solo se pueden atender turnos confirmados
 */
router.patch('/:id/atender', verificarToken, verificarRol('medico'), atender);

export default router;
