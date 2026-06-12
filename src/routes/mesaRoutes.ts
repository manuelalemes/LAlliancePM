import { Router } from 'express';
import {
  listarMesas,
  buscarMesa,
  criarMesa,
  verificarDisponibilidade,
} from '../controllers/mesaController';

const router = Router();

router.get('/', listarMesas);
router.get('/:numero', buscarMesa);
router.get('/:numero/disponibilidade', verificarDisponibilidade);
router.post('/', criarMesa);

export default router;
