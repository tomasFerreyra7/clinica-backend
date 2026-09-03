import { Router } from 'express';
import { registro, login, perfil } from '../controllers/auth.controller.js';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /auth/registro:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar un paciente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, dni, email, password, fecha_nacimiento, id_cobertura]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan
 *               apellido:
 *                 type: string
 *                 example: Perez
 *               dni:
 *                 type: string
 *                 example: "12345678"
 *               email:
 *                 type: string
 *                 example: juan@email.com
 *               password:
 *                 type: string
 *                 example: miPassword123
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1990-05-15"
 *               id_cobertura:
 *                 type: integer
 *                 example: 1
 *               telefono:
 *                 type: string
 *                 example: "1155556666"
 *     responses:
 *       201:
 *         description: Paciente registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaOk'
 *       400:
 *         description: Campos faltantes o invalidos
 *       409:
 *         description: DNI o email duplicado
 */
router.post('/registro', registro);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dni, password]
 *             properties:
 *               dni:
 *                 type: string
 *                 example: "12345678"
 *               password:
 *                 type: string
 *                 example: miPassword123
 *     responses:
 *       200:
 *         description: Token JWT generado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaOk'
 *       400:
 *         description: Campos faltantes
 *       401:
 *         description: Credenciales invalidas
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/perfil:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RespuestaOk'
 *       401:
 *         description: Token no provisto o invalido
 */
router.get('/perfil', verificarToken, perfil);

// Endpoint de prueba: solo demuestra verificarRol devolviendo 403 a roles no permitidos
router.get('/solo-admin', verificarToken, verificarRol('admin'), (req, res) => {
  res.json({ codigo: 200, estado: 'ok', datos: { mensaje: 'Acceso admin concedido', usuario: req.usuario } });
});

export default router;
