import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../types";

// Extender o tipo Request do Express para incluir o utilizador autenticado
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware de autenticação — verifica se o JWT é válido.
 *
 * Se válido, adiciona os dados do utilizador a req.user.
 * Se inválido, retorna 401 (Não Autenticado).
 */
export function autenticar(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extrair o token do header Authorization: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token de autenticação não fornecido" });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Token de autenticação inválido" });
      return;
    }

    // Verificar e decodificar o token
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error("JWT_ACCESS_SECRET não configurado");
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expirado" });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    res.status(500).json({ error: "Erro ao verificar autenticação" });
  }
}

/**
 * Middleware de verificação de role — verifica se o utilizador tem a role necessária.
 *
 * Deve ser usado DEPOIS do middleware autenticar.
 *
 * Uso: router.get("/admin", autenticar, verificarRole("ADMIN"), handler)
 */
export function verificarRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Utilizador não autenticado" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "Sem permissão para aceder a este recurso",
      });
      return;
    }

    next();
  };
}
