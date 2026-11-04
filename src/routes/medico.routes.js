import { Router } from 'express';
import { verificarToken } from '../middlewares/auth.middleware.js';
import { listarMedicos } from '../controllers/medico.controller.js';

const router = Router();

/**
 * @swagger
 * /medicos:
 *   get:
 *     tags: [Medicos]
 *     summary: Listar medicos con sus especialidades (solo nombre, apellido y especialidades)
 *     description: |
 *       Disponible para cualquier usuario autenticado. El filtro por sede devuelve los medicos
 *       cuya sede es la indicada o que tienen agenda cargada en esa sede.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_especialidad
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_sede
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de medicos
 *       400:
 *         description: Filtro invalido
 *       401:
 *         description: Token no provisto o invalido
 */
router.get('/', verificarToken, listarMedicos);

export default router;
