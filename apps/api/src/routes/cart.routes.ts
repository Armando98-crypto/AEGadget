import { Router } from "express";
import {
  obterCarrinho,
  adicionarItem,
  atualizarQuantidade,
  removerItem,
  limparCarrinho,
} from "../controllers/cart.controller";
import { autenticar } from "../middleware/auth.middleware";

const router = Router();

/**
 * Rotas do Carrinho — AE Gadget
 *
 * Todas requerem autenticação.
 *
 * GET    /api/cart              — Obter carrinho do utilizador
 * POST   /api/cart/items        — Adicionar item ao carrinho
 * PUT    /api/cart/items/:id    — Atualizar quantidade de um item
 * DELETE /api/cart/items/:id    — Remover item do carrinho
 * DELETE /api/cart              — Limpar carrinho
 */

router.use(autenticar);

router.get("/", obterCarrinho);
router.post("/items", adicionarItem);
router.put("/items/:id", atualizarQuantidade);
router.delete("/items/:id", removerItem);
router.delete("/", limparCarrinho);

export default router;
