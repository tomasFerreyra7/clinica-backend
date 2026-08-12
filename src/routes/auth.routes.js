import { Router } from 'express';
import { registro, login, perfil } from '../controllers/auth.controller.js';
import { verificarToken, verificarRol } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/registro', registro);
router.post('/login', login);
router.get('/perfil', verificarToken, perfil);

// Endpoint de prueba: solo demuestra verificarRol devolviendo 403 a roles no permitidos
router.get('/solo-admin', verificarToken, verificarRol('admin'), (req, res) => {
  res.json({ codigo: 200, estado: 'ok', datos: { mensaje: 'Acceso admin concedido', usuario: req.usuario } });
});

export default router;
