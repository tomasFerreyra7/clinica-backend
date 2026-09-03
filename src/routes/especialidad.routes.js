import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { crear, listar, actualizar, eliminar } from '../controllers/especialidad.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('admin'));

/**
 * @swagger
 * /especialidades:
 *   post:
 *     tags: [Especialidades]
 *     summary: Crear una especialidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [descripcion]
 *             properties:
 *               descripcion:
 *                 type: string
 *                 example: Cardiologia
 *     responses:
 *       201:
 *         description: Especialidad creada
 *       400:
 *         description: Datos invalidos
 *       409:
 *         description: Descripcion duplicada
 */
router.post('/', crear);

/**
 * @swagger
 * /especialidades:
 *   get:
 *     tags: [Especialidades]
 *     summary: Listar especialidades
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de especialidades
 */
router.get('/', listar);

/**
 * @swagger
 * /especialidades/{id}:
 *   put:
 *     tags: [Especialidades]
 *     summary: Actualizar una especialidad
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
 *             required: [descripcion]
 *             properties:
 *               descripcion:
 *                 type: string
 *                 example: Traumatologia
 *     responses:
 *       200:
 *         description: Especialidad actualizada
 *       404:
 *         description: Especialidad no encontrada
 *       409:
 *         description: Descripcion duplicada
 */
router.put('/:id', actualizar);

/**
 * @swagger
 * /especialidades/{id}:
 *   delete:
 *     tags: [Especialidades]
 *     summary: Eliminar una especialidad
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
 *         description: Especialidad eliminada
 *       404:
 *         description: Especialidad no encontrada
 *       409:
 *         description: Tiene medicos asociados
 */
router.delete('/:id', eliminar);

export default router;
