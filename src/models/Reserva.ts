import mongoose, { Document, Schema } from 'mongoose';

export type StatusReserva = 'reservado' | 'ocupado' | 'finalizado' | 'cancelado';

export interface IReserva extends Document {
  nomeCliente: string;
  contatoCliente: string;
  numeroMesa: number;
  quantidadePessoas: number;
  dataHoraReserva: Date;
  duracaoMinutos: number;
  observacoes?: string;
  status: StatusReserva;
  dataHoraFim: Date;
}

const ReservaSchema = new Schema<IReserva>(
  {
    nomeCliente: {
      type: String,
      required: [true, 'Nome do cliente é obrigatório'],
      trim: true,
      minlength: [2, 'Nome deve ter ao menos 2 caracteres'],
    },
    contatoCliente: {
      type: String,
      required: [true, 'Contato do cliente é obrigatório'],
      trim: true,
    },
    numeroMesa: {
      type: Number,
      required: [true, 'Número da mesa é obrigatório'],
    },
    quantidadePessoas: {
      type: Number,
      required: [true, 'Quantidade de pessoas é obrigatória'],
      min: [1, 'Mínimo 1 pessoa'],
    },
    dataHoraReserva: {
      type: Date,
      required: [true, 'Data e hora da reserva são obrigatórias'],
    },
    duracaoMinutos: {
      type: Number,
      default: 90, // 1h30 padrão
      min: [30, 'Duração mínima de 30 minutos'],
    },
    observacoes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['reservado', 'ocupado', 'finalizado', 'cancelado'],
        message: 'Status inválido',
      },
      default: 'reservado',
    },
    dataHoraFim: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Índice para evitar conflito de mesa no mesmo horário
ReservaSchema.index({ numeroMesa: 1, dataHoraReserva: 1 });

export const Reserva = mongoose.model<IReserva>('Reserva', ReservaSchema);
