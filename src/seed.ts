import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Mesa } from './models/Mesa';

const mesas = [
  { numero: 1,  capacidade: 2,  localizacao: 'salão' },
  { numero: 2,  capacidade: 2,  localizacao: 'salão' },
  { numero: 3,  capacidade: 4,  localizacao: 'salão' },
  { numero: 4,  capacidade: 4,  localizacao: 'salão' },
  { numero: 5,  capacidade: 4,  localizacao: 'salão' },
  { numero: 6,  capacidade: 6,  localizacao: 'salão' },
  { numero: 7,  capacidade: 6,  localizacao: 'área interna' },
  { numero: 8,  capacidade: 4,  localizacao: 'área interna' },
  { numero: 9,  capacidade: 4,  localizacao: 'área interna' },
  { numero: 10, capacidade: 8,  localizacao: 'varanda' },
  { numero: 11, capacidade: 6,  localizacao: 'varanda' },
  { numero: 12, capacidade: 10, localizacao: 'varanda' },
];

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reserva';
  await mongoose.connect(uri);
  console.log('✅ Conectado ao MongoDB');

  await Mesa.deleteMany({});
  await Mesa.insertMany(mesas);
  console.log(`✅ ${mesas.length} mesas cadastradas com sucesso`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
