import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { conectarBanco } from './database';
import mesaRoutes from './routes/mesaRoutes';
import reservaRoutes from './routes/reservaRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/mesas', mesaRoutes);
app.use('/api/reservas', reservaRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ sucesso: true, mensagem: 'API funcionando', timestamp: new Date() });
});

// Frontend – qualquer rota não-API serve o index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
conectarBanco().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
});
