import { Router } from 'express';
import {
  listarCoberturas,
  obtenerCobertura,
  crearCobertura,
  modificarCobertura,
  eliminarCobertura,
} from '../controllers/cobertura.controller.js';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /coberturas:
 *   get:
 *     tags: [Coberturas]
 *     summary: Listar coberturas activas (publico)
 *     responses:
 *       200:
 *         description: Lista de coberturas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaOk'
 */
router.get('/', listarCoberturas);

/**
 * @swagger
 * /coberturas/{id}:
 *   get:
 *     tags: [Coberturas]
 *     summary: Obtener una cobertura por ID
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
 *         description: Cobertura encontrada
 *       404:
 *         description: Cobertura no encontrada
 */
router.get('/:id', verificarToken, verificarRol('admin'), obtenerCobertura);

/**
 * @swagger
 * /coberturas:
 *   post:
 *     tags: [Coberturas]
 *     summary: Crear una cobertura
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: OSDE
 *     responses:
 *       201:
 *         description: Cobertura creada
 *       400:
 *         description: Datos invalidos
 */
router.post('/', verificarToken, verificarRol('admin'), crearCobertura);

/**
 * @swagger
 * /coberturas/{id}:
 *   put:
 *     tags: [Coberturas]
 *     summary: Modificar una cobertura
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
 *                 example: Swiss Medical
 *     responses:
 *       200:
 *         description: Cobertura modificada
 *       400:
 *         description: Datos invalidos
 *       404:
 *         description: Cobertura no encontrada
 */
router.put('/:id', verificarToken, verificarRol('admin'), modificarCobertura);

/**
 * @swagger
 * /coberturas/{id}:
 *   delete:
 *     tags: [Coberturas]
 *     summary: Eliminar (baja logica) una cobertura
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
 *         description: Cobertura eliminada
 *       404:
 *         description: Cobertura no encontrada
 *       409:
 *         description: Tiene usuarios asociados
 */
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarCobertura);

export default router;
