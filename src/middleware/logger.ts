import { Log } from '../models/Log';

export const registrarLog = async (
  acao: 'criação' | 'atualização' | 'cancelamento' | 'erro',
  entidade: string,
  entidadeId: string | undefined,
  detalhes: string,
  ip?: string
): Promise<void> => {
  try {
    await Log.create({ acao, entidade, entidadeId, detalhes, ip });
  } catch {
    console.error('[LOG] Falha ao registrar log:', detalhes);
  }
};
