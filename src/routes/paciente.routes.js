import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { buscarPacientes } from '../controllers/paciente.controller.js';

const router = Router();

/**
 * @swagger
 * /pacientes:
 *   get:
 *     tags: [Pacientes]
 *     summary: Buscar pacientes por DNI o apellido (prefijo)
 *     description: |
 *       Roles operador, medico y admin. Requiere al menos un filtro. Devuelve hasta 50
 *       resultados con los datos minimos necesarios (sin password ni email).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dni
 *         schema:
 *           type: string
 *         description: DNI completo o inicio del DNI (solo numeros)
 *       - in: query
 *         name: apellido
 *         schema:
 *           type: string
 *         description: Inicio del apellido (minimo 2 caracteres)
 *     responses:
 *       200:
 *         description: Lista de pacientes
 *       400:
 *         description: Sin filtros o filtros invalidos
 *       403:
 *         description: Rol sin permisos
 */
router.get('/', verificarToken, verificarRol('operador', 'medico', 'admin'), buscarPacientes);

export default router;
