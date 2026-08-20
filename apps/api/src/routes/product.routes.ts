import { Router } from "express";
import {
  listarProdutos,
  obterProduto,
  criarProduto,
  atualizarProduto,
  eliminarProduto,
} from "../controllers/product.controller";
import { autenticar, verificarRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Rotas de Produtos — AE Gadget
 *
 * GET    /api/products              — Listar produtos (público, com paginação/filtro)
 * GET    /api/products/:slug        — Obter produto por slug (público)
 * POST   /api/products              — Criar produto (ADMIN/VENDOR)
 * PUT    /api/products/:id          — Atualizar produto (ADMIN/VENDOR)
 * DELETE /api/products/:id          — Eliminar produto (ADMIN)
 */

// Rotas públicas
router.get("/", listarProdutos);
router.get("/:slug", obterProduto);

// Rotas protegidas — apenas ADMIN ou VENDOR
router.post("/", autenticar, verificarRole("ADMIN", "VENDOR"), criarProduto);
router.put("/:id", autenticar, verificarRole("ADMIN", "VENDOR"), atualizarProduto);
router.delete("/:id", autenticar, verificarRole("ADMIN"), eliminarProduto);

export default router;
