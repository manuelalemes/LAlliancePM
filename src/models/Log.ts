import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  acao: 'criação' | 'atualização' | 'cancelamento' | 'erro';
  entidade: string;
  entidadeId?: string;
  detalhes: string;
  ip?: string;
}

const LogSchema = new Schema<ILog>(
  {
    acao: {
      type: String,
      required: true,
      enum: ['criação', 'atualização', 'cancelamento', 'erro'],
    },
    entidade: { type: String, required: true },
    entidadeId: { type: String },
    detalhes: { type: String, required: true },
    ip: { type: String },
  },
  { timestamps: true }
);

export const Log = mongoose.model<ILog>('Log', LogSchema);
