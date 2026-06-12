import { Request, Response } from 'express';
import { Mesa } from '../models/Mesa';
import { Reserva } from '../models/Reserva';
import { registrarLog } from '../middleware/logger';

// Listar todas as mesas com status atual
export const listarMesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const mesas = await Mesa.find({ ativa: true }).sort({ numero: 1 });
    const agora = new Date();

    // Para cada mesa, calcular status atual baseado nas reservas ativas
    const mesasComStatus = await Promise.all(
      mesas.map(async (mesa) => {
        const reservaAtiva = await Reserva.findOne({
          numeroMesa: mesa.numero,
          status: { $in: ['reservado', 'ocupado'] },
        }).sort({ dataHoraReserva: 1 });

        let statusAtual = 'disponível';
        let proximaReserva = null;

        if (reservaAtiva) {
          const inicio = new Date(reservaAtiva.dataHoraReserva);
          const fim = new Date(reservaAtiva.dataHoraFim);

          if (agora >= inicio && agora <= fim) {
            statusAtual = 'ocupado';
          } else if (agora < inicio) {
            statusAtual = 'reservado';
            proximaReserva = reservaAtiva;
          }
        }

        return {
          ...mesa.toObject(),
          statusAtual,
          proximaReserva,
        };
      })
    );

    res.json({ sucesso: true, dados: mesasComStatus });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao listar mesas', erro: String(error) });
  }
};

// Buscar mesa por número
export const buscarMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numero } = req.params;
    const mesa = await Mesa.findOne({ numero: Number(numero), ativa: true });

    if (!mesa) {
      res.status(404).json({ sucesso: false, mensagem: 'Mesa não encontrada' });
      return;
    }

    res.json({ sucesso: true, dados: mesa });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar mesa', erro: String(error) });
  }
};

// Criar mesa
export const criarMesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const mesa = new Mesa(req.body);
    await mesa.save();

    await registrarLog('criação', 'Mesa', String(mesa._id), `Mesa ${mesa.numero} criada`, req.ip);
    res.status(201).json({ sucesso: true, mensagem: 'Mesa criada com sucesso', dados: mesa });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ sucesso: false, mensagem: 'Já existe uma mesa com esse número' });
      return;
    }
    res.status(400).json({ sucesso: false, mensagem: error.message || 'Erro ao criar mesa' });
  }
};

// Verificar disponibilidade de uma mesa
export const verificarDisponibilidade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numero } = req.params;
    const { dataHoraReserva, duracaoMinutos = 90 } = req.query;

    if (!dataHoraReserva) {
      res.status(400).json({ sucesso: false, mensagem: 'Informe a data e hora da reserva' });
      return;
    }

    const inicio = new Date(String(dataHoraReserva));
    const fim = new Date(inicio.getTime() + Number(duracaoMinutos) * 60000);

    const conflito = await Reserva.findOne({
      numeroMesa: Number(numero),
      status: { $in: ['reservado', 'ocupado'] },
      $or: [
        { dataHoraReserva: { $lt: fim }, dataHoraFim: { $gt: inicio } },
      ],
    });

    res.json({
      sucesso: true,
      disponivel: !conflito,
      mensagem: conflito ? 'Mesa não disponível nesse horário' : 'Mesa disponível',
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro ao verificar disponibilidade' });
  }
};
