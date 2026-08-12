import { Router } from 'express';
import { listarCoberturas } from '../controllers/cobertura.controller.js';

const router = Router();

router.get('/', listarCoberturas);

export default router;
