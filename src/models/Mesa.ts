import mongoose, { Document, Schema } from 'mongoose';

export interface IMesa extends Document {
  numero: number;
  capacidade: number;
  localizacao: 'salão' | 'varanda' | 'área interna';
  ativa: boolean;
}

const MesaSchema = new Schema<IMesa>(
  {
    numero: {
      type: Number,
      required: [true, 'Número da mesa é obrigatório'],
      unique: true,
      min: [1, 'Número deve ser maior que 0'],
    },
    capacidade: {
      type: Number,
      required: [true, 'Capacidade é obrigatória'],
      min: [1, 'Capacidade mínima é 1 pessoa'],
      max: [20, 'Capacidade máxima é 20 pessoas'],
    },
    localizacao: {
      type: String,
      required: [true, 'Localização é obrigatória'],
      enum: {
        values: ['salão', 'varanda', 'área interna'],
        message: 'Localização inválida. Use: salão, varanda ou área interna',
      },
    },
    ativa: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Mesa = mongoose.model<IMesa>('Mesa', MesaSchema);
