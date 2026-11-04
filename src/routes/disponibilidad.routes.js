import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { fechas, horarios } from '../controllers/disponibilidad.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('paciente', 'operador'));

/**
 * @swagger
 * /disponibilidad/fechas:
 *   get:
 *     tags: [Disponibilidad]
 *     summary: Fechas con agenda y al menos un horario libre
 *     description: |
 *       Roles paciente y operador. Para un medico, especialidad y sede devuelve las fechas
 *       (desde hoy) en las que hay agenda y queda al menos un horario libre. Los turnos duran
 *       30 minutos. No expone datos de pacientes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_medico
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_especialidad
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_sede
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de fechas YYYY-MM-DD en orden ascendente
 *       400:
 *         description: Parametros faltantes o invalidos
 *       403:
 *         description: Rol sin permisos
 */
router.get('/fechas', fechas);

/**
 * @swagger
 * /disponibilidad/horarios:
 *   get:
 *     tags: [Disponibilidad]
 *     summary: Horarios libres de un medico en una fecha
 *     description: |
 *       Roles paciente y operador. Devuelve los horarios de inicio (HH:MM) de turnos de
 *       30 minutos que caben en la agenda del medico para esa especialidad, sede y fecha, sin
 *       los que se superponen con turnos confirmados. Si la fecha es hoy, excluye los horarios
 *       que ya pasaron. No expone datos de pacientes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id_medico
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_especialidad
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: id_sede
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de horarios HH:MM en orden ascendente
 *       400:
 *         description: Parametros faltantes o invalidos
 *       403:
 *         description: Rol sin permisos
 */
router.get('/horarios', horarios);

export default router;
