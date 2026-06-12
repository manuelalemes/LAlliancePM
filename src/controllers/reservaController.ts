import { Request, Response } from 'express';
import { Reserva } from '../models/Reserva';
import { Mesa } from '../models/Mesa';
import { registrarLog } from '../middleware/logger';

// Atualizar status das reservas conforme o tempo atual
const atualizarStatusReservas = async (): Promise<void> => {
  const agora = new Date();

  // reservado → ocupado (quando chegou o horário)
  await Reserva.updateMany(
    { status: 'reservado', dataHoraReserva: { $lte: agora }, dataHoraFim: { $gt: agora } },
    { status: 'ocupado' }
  );

  // ocupado → finalizado (quando passou o horário)
  await Reserva.updateMany(
    { status: { $in: ['reservado', 'ocupado'] }, dataHoraFim: { $lte: agora } },
    { status: 'finalizado' }
  );
};

// Listar reservas com filtros
export const listarReservas = async (req: Request, res: Response): Promise<void> => {
  try {
    await atualizarStatusReservas();

    const { cliente, mesa, data, status } = req.query;
    const filtro: Record<string, any> = {};

    if (cliente) filtro.nomeCliente = { $regex: String(cliente), $options: 'i' };
    if (mesa) filtro.numeroMesa = Number(mesa);
    if (status) filtro.status = String(status);
    if (data) {
      const inicio = new Date(String(data));
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(inicio);
      fim.setHours(23, 59, 59, 999);
      filtro.dataHoraReserva = { $gte: inicio, $lte: fim };
    }

    const reservas = await Reserva.find(filtro).sort({ dataHoraReserva: -1 });
    res.json({ sucesso: true, total: reservas.length, dados: reservas });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao listar reservas', erro: String(error) });
  }
};

// Buscar reserva por ID
export const buscarReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    await atualizarStatusReservas();
    const reserva = await Reserva.findById(req.params.id);

    if (!reserva) {
      res.status(404).json({ sucesso: false, mensagem: 'Reserva não encontrada' });
      return;
    }

    res.json({ sucesso: true, dados: reserva });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar reserva' });
  }
};

// Criar reserva
export const criarReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numeroMesa, quantidadePessoas, dataHoraReserva, duracaoMinutos = 90 } = req.body;

    // 1. Verificar se a mesa existe
    const mesa = await Mesa.findOne({ numero: numeroMesa, ativa: true });
    if (!mesa) {
      res.status(404).json({ sucesso: false, mensagem: `Mesa ${numeroMesa} não encontrada` });
      return;
    }

    // 2. Validar capacidade
    if (quantidadePessoas > mesa.capacidade) {
      res.status(400).json({
        sucesso: false,
        mensagem: `Mesa ${numeroMesa} comporta no máximo ${mesa.capacidade} pessoas`,
      });
      return;
    }

    // 3. Validar antecedência mínima de 1 hora
    const inicio = new Date(dataHoraReserva);
    const agora = new Date();
    const diferencaMs = inicio.getTime() - agora.getTime();
    const diferencaHoras = diferencaMs / (1000 * 60 * 60);

    if (diferencaHoras < 1) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Reservas devem ser feitas com no mínimo 1 hora de antecedência',
      });
      return;
    }

    // 4. Calcular horário de fim
    const fim = new Date(inicio.getTime() + Number(duracaoMinutos) * 60000);

    // 5. Verificar conflito de horário na mesa
    const conflito = await Reserva.findOne({
      numeroMesa,
      status: { $in: ['reservado', 'ocupado'] },
      $or: [{ dataHoraReserva: { $lt: fim }, dataHoraFim: { $gt: inicio } }],
    });

    if (conflito) {
      res.status(409).json({
        sucesso: false,
        mensagem: `Mesa ${numeroMesa} já está reservada nesse horário`,
        conflito: {
          de: conflito.dataHoraReserva,
          ate: conflito.dataHoraFim,
          cliente: conflito.nomeCliente,
        },
      });
      return;
    }

    // 6. Criar reserva
    const reserva = new Reserva({ ...req.body, dataHoraFim: fim, status: 'reservado' });
    await reserva.save();

    await registrarLog('criação', 'Reserva', String(reserva._id),
      `Reserva criada: ${reserva.nomeCliente} - Mesa ${numeroMesa} em ${inicio.toLocaleString('pt-BR')}`,
      req.ip
    );

    res.status(201).json({ sucesso: true, mensagem: 'Reserva criada com sucesso', dados: reserva });
  } catch (error: any) {
    await registrarLog('erro', 'Reserva', undefined, `Erro ao criar reserva: ${error.message}`, req.ip);
    res.status(400).json({ sucesso: false, mensagem: error.message || 'Erro ao criar reserva' });
  }
};

// Atualizar reserva
export const atualizarReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const reserva = await Reserva.findById(req.params.id);

    if (!reserva) {
      res.status(404).json({ sucesso: false, mensagem: 'Reserva não encontrada' });
      return;
    }

    if (reserva.status === 'cancelado' || reserva.status === 'finalizado') {
      res.status(400).json({
        sucesso: false,
        mensagem: `Não é possível editar uma reserva com status "${reserva.status}"`,
      });
      return;
    }

    // Se atualizar horário, recalcular fim e verificar conflito
    if (req.body.dataHoraReserva || req.body.duracaoMinutos) {
      const novoInicio = req.body.dataHoraReserva
        ? new Date(req.body.dataHoraReserva)
        : reserva.dataHoraReserva;
      const novaDuracao = req.body.duracaoMinutos || reserva.duracaoMinutos;
      const novoFim = new Date(novoInicio.getTime() + novaDuracao * 60000);

      const conflito = await Reserva.findOne({
        _id: { $ne: reserva._id },
        numeroMesa: req.body.numeroMesa || reserva.numeroMesa,
        status: { $in: ['reservado', 'ocupado'] },
        $or: [{ dataHoraReserva: { $lt: novoFim }, dataHoraFim: { $gt: novoInicio } }],
      });

      if (conflito) {
        res.status(409).json({ sucesso: false, mensagem: 'Conflito de horário com outra reserva' });
        return;
      }

      req.body.dataHoraFim = novoFim;
    }

    const atualizada = await Reserva.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await registrarLog('atualização', 'Reserva', String(reserva._id),
      `Reserva atualizada: ${reserva.nomeCliente} - Mesa ${reserva.numeroMesa}`, req.ip
    );

    res.json({ sucesso: true, mensagem: 'Reserva atualizada com sucesso', dados: atualizada });
  } catch (error: any) {
    res.status(400).json({ sucesso: false, mensagem: error.message || 'Erro ao atualizar reserva' });
  }
};

// Cancelar reserva
export const cancelarReserva = async (req: Request, res: Response): Promise<void> => {
  try {
    const reserva = await Reserva.findById(req.params.id);

    if (!reserva) {
      res.status(404).json({ sucesso: false, mensagem: 'Reserva não encontrada' });
      return;
    }

    if (reserva.status === 'cancelado') {
      res.status(400).json({ sucesso: false, mensagem: 'Reserva já foi cancelada' });
      return;
    }

    if (reserva.status === 'finalizado') {
      res.status(400).json({ sucesso: false, mensagem: 'Não é possível cancelar uma reserva finalizada' });
      return;
    }

    reserva.status = 'cancelado';
    await reserva.save();

    await registrarLog('cancelamento', 'Reserva', String(reserva._id),
      `Reserva cancelada: ${reserva.nomeCliente} - Mesa ${reserva.numeroMesa}`, req.ip
    );

    res.json({ sucesso: true, mensagem: 'Reserva cancelada com sucesso', dados: reserva });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao cancelar reserva' });
  }
};
