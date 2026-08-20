import { Router } from "express";
import { registrar, login, refreshToken, obterPerfil } from "../controllers/auth.controller";
import { autenticar, verificarRole } from "../middleware/auth.middleware";

const router = Router();

/**
 * Rotas de Autenticação — AE Gadget
 *
 * POST /api/auth/registar    — Registar novo utilizador
 * POST /api/auth/login       — Login (devolve access + refresh token)
 * POST /api/auth/refresh     — Renovar access token usando refresh token
 * GET  /api/auth/perfil      — Obter perfil do utilizador autenticado
 */

// Registo — qualquer pessoa pode criar conta
router.post("/registar", registrar);

// Login — retorna tokens de acesso
router.post("/login", login);

// Refresh token — renovar access token
router.post("/refresh", refreshToken);

// Perfil — apenas utilizadores autenticados
router.get("/perfil", autenticar, obterPerfil);

// Exemplo de rota admin — apenas utilizadores com role ADMIN
router.get(
  "/admin/area-restrita",
  autenticar,
  verificarRole("ADMIN"),
  (_req, res) => {
    res.json({ message: "Área de admin — acesso autorizado!" });
  }
);

export default router;
