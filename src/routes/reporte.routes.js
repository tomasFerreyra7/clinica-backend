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

router.get('/turnos-por-especialidad', reporteTurnosPorEspecialidad);
router.get('/turnos-por-sede', reporteTurnosPorSede);
router.get('/ranking-medicos', reporteRankingMedicos);
router.get('/tasa-cancelacion', reporteTasaCancelacion);

export default router;
