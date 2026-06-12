import { Router } from 'express';
import {
  listarReservas,
  buscarReserva,
  criarReserva,
  atualizarReserva,
  cancelarReserva,
} from '../controllers/reservaController';

const router = Router();

router.get('/', listarReservas);
router.get('/:id', buscarReserva);
router.post('/', criarReserva);
router.put('/:id', atualizarReserva);
router.delete('/:id', cancelarReserva);

export default router;
