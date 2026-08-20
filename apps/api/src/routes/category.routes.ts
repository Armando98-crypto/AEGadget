import { Router } from "express";
import {
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  eliminarCategoria,
} from "../controllers/category.controller";
import { autenticar, verificarRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Rotas de Categorias — AE Gadget
 *
 * GET    /api/categories         — Listar categorias (público)
 * POST   /api/categories         — Criar categoria (ADMIN)
 * PUT    /api/categories/:id     — Atualizar categoria (ADMIN)
 * DELETE /api/categories/:id     — Eliminar categoria (ADMIN)
 */

router.get("/", listarCategorias);
router.post("/", autenticar, verificarRole("ADMIN"), criarCategoria);
router.put("/:id", autenticar, verificarRole("ADMIN"), atualizarCategoria);
router.delete("/:id", autenticar, verificarRole("ADMIN"), eliminarCategoria);

export default router;
