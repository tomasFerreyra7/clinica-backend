import { Router } from 'express';
import {
  listarSedes,
  obtenerSede,
  crearSede,
  modificarSede,
  eliminarSede,
} from '../controllers/sede.controller.js';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /sedes:
 *   get:
 *     tags: [Sedes]
 *     summary: Listar sedes activas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sedes
 */
router.get('/', verificarToken, verificarRol('admin'), listarSedes);

/**
 * @swagger
 * /sedes/{id}:
 *   get:
 *     tags: [Sedes]
 *     summary: Obtener una sede por ID
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
 *         description: Sede encontrada
 *       404:
 *         description: Sede no encontrada
 */
router.get('/:id', verificarToken, verificarRol('admin'), obtenerSede);

/**
 * @swagger
 * /sedes:
 *   post:
 *     tags: [Sedes]
 *     summary: Crear una sede
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, direccion, telefono]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Sede Central
 *               direccion:
 *                 type: string
 *                 example: Av. Siempreviva 742
 *               telefono:
 *                 type: string
 *                 example: "011-4444-5555"
 *     responses:
 *       201:
 *         description: Sede creada
 *       400:
 *         description: Datos invalidos
 */
router.post('/', verificarToken, verificarRol('admin'), crearSede);

/**
 * @swagger
 * /sedes/{id}:
 *   put:
 *     tags: [Sedes]
 *     summary: Modificar una sede
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
 *             properties:
 *               nombre:
 *                 type: string
 *               direccion:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sede modificada
 *       404:
 *         description: Sede no encontrada
 */
router.put('/:id', verificarToken, verificarRol('admin'), modificarSede);

/**
 * @swagger
 * /sedes/{id}:
 *   delete:
 *     tags: [Sedes]
 *     summary: Eliminar (baja logica) una sede
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
 *         description: Sede eliminada
 *       404:
 *         description: Sede no encontrada
 *       409:
 *         description: Tiene medicos, operadores o agendas asociadas
 */
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarSede);

export default router;
