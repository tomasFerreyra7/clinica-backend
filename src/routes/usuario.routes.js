import { Router } from 'express';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';
import { listar, obtener, crear, actualizar } from '../controllers/usuario.controller.js';

const router = Router();

router.use(verificarToken, verificarRol('admin'));

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 3
 *         nombre:
 *           type: string
 *           example: Ana
 *         apellido:
 *           type: string
 *           example: Lopez
 *         dni:
 *           type: string
 *           example: "20111222"
 *         email:
 *           type: string
 *           example: alopez@clinica.com
 *         telefono:
 *           type: string
 *           example: "1100000000"
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *           example: "1985-03-10"
 *         rol:
 *           type: string
 *           enum: [admin, operador, medico, paciente]
 *           example: medico
 *         id_sede:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         sede:
 *           type: string
 *           nullable: true
 *           example: Sede Centro
 *         id_cobertura:
 *           type: integer
 *           nullable: true
 *           example: null
 *         cobertura:
 *           type: string
 *           nullable: true
 *           example: null
 *     UsuarioDetalle:
 *       allOf:
 *         - $ref: '#/components/schemas/Usuario'
 *         - type: object
 *           properties:
 *             especialidades:
 *               type: array
 *               description: Vacio si el usuario no es medico
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   descripcion:
 *                     type: string
 *                     example: Traumatologia
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar usuarios paginado y con filtros (solo admin)
 *     description: Ordenado por apellido, nombre e id. Los parametros vacios se ignoran.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         description: Contiene (maximo 30 caracteres)
 *         schema:
 *           type: string
 *       - in: query
 *         name: apellido
 *         description: Contiene (maximo 30 caracteres)
 *         schema:
 *           type: string
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *           enum: [admin, operador, medico, paciente]
 *       - in: query
 *         name: id_sede
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Pagina de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/RespuestaOk'
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Usuario'
 *                         total:
 *                           type: integer
 *                           example: 13
 *                         pagina:
 *                           type: integer
 *                           example: 1
 *                         limite:
 *                           type: integer
 *                           example: 10
 *                         total_paginas:
 *                           type: integer
 *                           example: 2
 *       400:
 *         description: Parametro invalido
 *       401:
 *         description: Token no provisto o invalido
 *       403:
 *         description: El usuario no es admin
 */
router.get('/', listar);

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener el detalle de un usuario (solo admin)
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
 *         description: Usuario con sus especialidades
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/RespuestaOk'
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       $ref: '#/components/schemas/UsuarioDetalle'
 *       400:
 *         description: Id invalido
 *       401:
 *         description: Token no provisto o invalido
 *       403:
 *         description: El usuario no es admin
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', obtener);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     tags: [Usuarios]
 *     summary: Dar de alta un operador, medico o administrador (solo admin)
 *     description: |
 *       Operador y medico requieren id_sede. El medico requiere especialidades.
 *       El administrador no tiene sede. Los pacientes se registran con POST /auth/registro.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellido, dni, email, password, telefono, fecha_nacimiento, rol]
 *             properties:
 *               nombre:
 *                 type: string
 *                 maxLength: 30
 *                 example: Ana
 *               apellido:
 *                 type: string
 *                 maxLength: 30
 *                 example: Lopez
 *               dni:
 *                 type: string
 *                 description: 7 u 8 digitos
 *                 example: "20111222"
 *               email:
 *                 type: string
 *                 maxLength: 30
 *                 example: alopez@clinica.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: clave123
 *               telefono:
 *                 type: string
 *                 description: 6 a 10 digitos
 *                 example: "1100000000"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1985-03-10"
 *               rol:
 *                 type: string
 *                 enum: [operador, medico, admin]
 *                 example: medico
 *               id_sede:
 *                 type: integer
 *                 description: Solo operador y medico
 *                 example: 1
 *               especialidades:
 *                 type: array
 *                 description: Solo medico. Ids de especialidad, sin repetidos
 *                 items:
 *                   type: integer
 *                 example: [1]
 *     responses:
 *       201:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/RespuestaOk'
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       $ref: '#/components/schemas/UsuarioDetalle'
 *       400:
 *         description: Datos invalidos o que no corresponden al rol
 *       401:
 *         description: Token no provisto o invalido
 *       403:
 *         description: El usuario no es admin
 *       409:
 *         description: Ya existe un usuario con ese DNI o email
 */
router.post('/', crear);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     tags: [Usuarios]
 *     summary: Editar un usuario de cualquier rol (solo admin)
 *     description: |
 *       Se envia el formulario completo segun el rol actual del usuario. El rol no se puede modificar.
 *       password es opcional: si no se envia, no cambia. Para un medico, especialidades reemplaza
 *       todas las que tenia.
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
 *             required: [nombre, apellido, dni, email, telefono, fecha_nacimiento]
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Ana
 *               apellido:
 *                 type: string
 *                 example: Lopez
 *               dni:
 *                 type: string
 *                 example: "20111222"
 *               email:
 *                 type: string
 *                 example: alopez@clinica.com
 *               telefono:
 *                 type: string
 *                 example: "1100000000"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "1985-03-10"
 *               password:
 *                 type: string
 *                 description: Opcional
 *                 example: nuevaClave1
 *               rol:
 *                 type: string
 *                 description: Opcional. Si es distinto del actual da 400
 *               id_sede:
 *                 type: integer
 *                 description: Obligatoria para operador y medico
 *                 example: 1
 *               especialidades:
 *                 type: array
 *                 description: Obligatorias para medico
 *                 items:
 *                   type: integer
 *                 example: [1]
 *               id_cobertura:
 *                 type: integer
 *                 description: Obligatoria para paciente
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/RespuestaOk'
 *                 - type: object
 *                   properties:
 *                     datos:
 *                       $ref: '#/components/schemas/UsuarioDetalle'
 *       400:
 *         description: Datos invalidos o intento de cambiar el rol
 *       401:
 *         description: Token no provisto o invalido
 *       403:
 *         description: El usuario no es admin
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: DNI o email de otro usuario, o se quita una especialidad con agenda
 */
router.put('/:id', actualizar);

export default router;
