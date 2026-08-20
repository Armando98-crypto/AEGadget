import { Router } from "express";
import {
  criarEncomenda,
  listarEncomendas,
  obterEncomenda,
  atualizarEstado,
} from "../controllers/order.controller";
import { autenticar, verificarRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Rotas de Encomendas — AE Gadget
 *
 * POST   /api/orders              — Criar encomenda a partir do carrinho (CLIENTE)
 * GET    /api/orders              — Listar encomendas (CLIENTE: as suas / ADMIN: todas)
 * GET    /api/orders/:id          — Obter detalhe de encomenda
 * PUT    /api/orders/:id/status   — Atualizar estado (ADMIN)
 */

router.use(autenticar);

router.post("/", criarEncomenda);
router.get("/", listarEncomendas);
router.get("/:id", obterEncomenda);
router.put("/:id/status", verificarRole("ADMIN"), atualizarEstado);

export default router;
