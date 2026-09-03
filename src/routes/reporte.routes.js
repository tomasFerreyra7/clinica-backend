import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import {
  reporteTurnosPorEspecialidad,
  reporteTurnosPorSede,
  reporteRankingMedicos,
  reporteTasaCancelacion,
} from '../controllers/reporte.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('admin'));

/**
 * @swagger
 * /reportes/turnos-por-especialidad:
 *   get:
 *     tags: [Reportes]
 *     summary: Turnos agrupados por especialidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte generado
 *       400:
 *         description: Rango de fechas invalido
 */
router.get('/turnos-por-especialidad', reporteTurnosPorEspecialidad);

/**
 * @swagger
 * /reportes/turnos-por-sede:
 *   get:
 *     tags: [Reportes]
 *     summary: Turnos agrupados por sede
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte generado
 *       400:
 *         description: Rango de fechas invalido
 */
router.get('/turnos-por-sede', reporteTurnosPorSede);

/**
 * @swagger
 * /reportes/ranking-medicos:
 *   get:
 *     tags: [Reportes]
 *     summary: Ranking de medicos por turnos atendidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte generado
 *       400:
 *         description: Rango de fechas invalido
 */
router.get('/ranking-medicos', reporteRankingMedicos);

/**
 * @swagger
 * /reportes/tasa-cancelacion:
 *   get:
 *     tags: [Reportes]
 *     summary: Tasa de cancelacion de turnos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: desde
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte generado
 *       400:
 *         description: Rango de fechas invalido
 */
router.get('/tasa-cancelacion', reporteTasaCancelacion);

export default router;
