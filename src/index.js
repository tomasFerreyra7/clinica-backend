import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './database/db.js';
import { enviarOk, enviarError } from './utils/respuesta.js';
import authRoutes from './routes/auth.routes.js';
import coberturaRoutes from './routes/cobertura.routes.js';
import sedeRoutes from './routes/sede.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return enviarOk(res, 200, { db: 'conectada' });
  } catch (error) {
    console.error(error);
    return enviarError(res, 500, 'No se pudo conectar a la base de datos');
  }
});

app.use('/auth', authRoutes);
app.use('/coberturas', coberturaRoutes);
app.use('/sedes', sedeRoutes);

// 404
app.use((req, res) => {
  return enviarError(res, 404, 'Recurso no encontrado');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
