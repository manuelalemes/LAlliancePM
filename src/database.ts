import mongoose from 'mongoose';

export const conectarBanco = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reserva';

  try {
    await mongoose.connect(uri);
    console.log(`✅ MongoDB conectado: ${uri}`);
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB desconectado');
  });
};
