import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear, listar, actualizar, eliminar } from '../controllers/agenda.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('operador', 'medico'));

/**
 * @swagger
 * /agendas:
 *   post:
 *     tags: [Agendas]
 *     summary: Crear un bloque de agenda
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede]
 *             properties:
 *               hora_entrada:
 *                 type: string
 *                 example: "08:00"
 *               hora_salida:
 *                 type: string
 *                 example: "12:00"
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-10"
 *               id_medico:
 *                 type: integer
 *                 example: 1
 *               id_especialidad:
 *                 type: integer
 *                 example: 1
 *               id_sede:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Agenda creada
 *       400:
 *         description: Datos invalidos o relaciones inexistentes
 *       403:
 *         description: Medico no puede gestionar agenda de otro medico
 *       409:
 *         description: Horario se solapa con otra agenda
 */
router.post('/', crear);

/**
 * @swagger
 * /agendas:
 *   get:
 *     tags: [Agendas]
 *     summary: Listar agendas (con filtros opcionales)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_medico
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_sede
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de agendas
 */
router.get('/', listar);

/**
 * @swagger
 * /agendas/{id}:
 *   put:
 *     tags: [Agendas]
 *     summary: Actualizar un bloque de agenda
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hora_entrada, hora_salida, fecha, id_medico, id_especialidad, id_sede]
 *             properties:
 *               hora_entrada:
 *                 type: string
 *                 example: "09:00"
 *               hora_salida:
 *                 type: string
 *                 example: "13:00"
 *               fecha:
 *                 type: string
 *                 format: date
 *               id_medico:
 *                 type: integer
 *               id_especialidad:
 *                 type: integer
 *               id_sede:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Agenda actualizada
 *       404:
 *         description: Agenda no encontrada
 *       409:
 *         description: Horario se solapa
 */
router.put('/:id', actualizar);

/**
 * @swagger
 * /agendas/{id}:
 *   delete:
 *     tags: [Agendas]
 *     summary: Eliminar un bloque de agenda
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
 *         description: Agenda eliminada
 *       404:
 *         description: Agenda no encontrada
 */
router.delete('/:id', eliminar);

export default router;
