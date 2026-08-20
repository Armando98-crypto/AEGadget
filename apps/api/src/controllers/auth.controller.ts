import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../server";
import { AuthTokens, JWTPayload } from "../types";

// ============================================
// VALIDAÇÕES COM ZOD
// ============================================

const registarSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome demasiado longo"),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email demasiado longo"),
  telefone: z
    .string()
    .regex(/^\+?244[9][1-9]\d{7}$/, "Telefone inválido. Formato: +244XXXXXXXXX")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, "Palavra-passe deve ter pelo menos 6 caracteres")
    .max(100, "Palavra-passe demasiado longa"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As palavras-passe não coincidem",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe é obrigatória"),
});

// ============================================
// HELPERS JWT
// ============================================

function gerarAccessToken(payload: JWTPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

  if (!secret) throw new Error("JWT_ACCESS_SECRET não configurado");

  return jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role },
    secret,
    { expiresIn }
  );
}

function gerarRefreshToken(payload: JWTPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

  if (!secret) throw new Error("JWT_REFRESH_SECRET não configurado");

  return jwt.sign(
    { sub: payload.sub, email: payload.email, role: payload.role },
    secret,
    { expiresIn }
  );
}

// ============================================
// CONTROLADORES
// ============================================

/**
 * POST /api/auth/registar
 * Registar novo utilizador (cliente por defeito)
 */
export async function registrar(req: Request, res: Response): Promise<void> {
  try {
    // Validar dados de entrada
    const dados = registarSchema.parse(req.body);

    // Verificar se o email já está em uso
    const existente = await prisma.user.findUnique({
      where: { email: dados.email },
    });

    if (existente) {
      res.status(409).json({ error: "Este email já está registado" });
      return;
    }

    // Hash da palavra-passe
    const passwordHash = await bcrypt.hash(dados.password, 12);

    // Criar utilizador
    const utilizador = await prisma.user.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone || null,
        passwordHash,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Gerar tokens
    const tokenPayload: JWTPayload = {
      sub: utilizador.id,
      email: utilizador.email,
      role: utilizador.role,
    };

    const tokens: AuthTokens = {
      accessToken: gerarAccessToken(tokenPayload),
      refreshToken: gerarRefreshToken(tokenPayload),
    };

    res.status(201).json({
      success: true,
      message: "Conta criada com sucesso!",
      data: {
        utilizador,
        ...tokens,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Dados inválidos",
        details: error.errors.map((e) => ({
          campo: e.path.join("."),
          mensagem: e.message,
        })),
      });
      return;
    }

    console.error("Erro no registo:", error);
    res.status(500).json({ error: "Erro ao criar conta" });
  }
}

/**
 * POST /api/auth/login
 * Login — retorna access token e refresh token
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validar dados de entrada
    const dados = loginSchema.parse(req.body);

    // Procurar utilizador por email
    const utilizador = await prisma.user.findUnique({
      where: { email: dados.email },
    });

    if (!utilizador) {
      // Por segurança, não revelar se o email existe ou não
      res.status(401).json({ error: "Email ou palavra-passe incorretos" });
      return;
    }

    // Verificar palavra-passe
    const passwordValido = await bcrypt.compare(
      dados.password,
      utilizador.passwordHash
    );

    if (!passwordValido) {
      res.status(401).json({ error: "Email ou palavra-passe incorretos" });
      return;
    }

    // Gerar tokens
    const tokenPayload: JWTPayload = {
      sub: utilizador.id,
      email: utilizador.email,
      role: utilizador.role,
    };

    const tokens: AuthTokens = {
      accessToken: gerarAccessToken(tokenPayload),
      refreshToken: gerarRefreshToken(tokenPayload),
    };

    res.json({
      success: true,
      message: "Login efetuado com sucesso!",
      data: {
        utilizador: {
          id: utilizador.id,
          nome: utilizador.nome,
          email: utilizador.email,
          role: utilizador.role,
        },
        ...tokens,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Dados inválidos",
        details: error.errors.map((e) => ({
          campo: e.path.join("."),
          mensagem: e.message,
        })),
      });
      return;
    }

    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao efetuar login" });
  }
}

/**
 * POST /api/auth/refresh
 * Renovar access token usando refresh token
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: "Refresh token não fornecido" });
      return;
    }

    // Verificar refresh token
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error("JWT_REFRESH_SECRET não configurado");
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Verificar se o utilizador ainda existe
    const utilizador = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!utilizador) {
      res.status(401).json({ error: "Utilizador não encontrado" });
      return;
    }

    // Gerar novos tokens
    const tokenPayload: JWTPayload = {
      sub: utilizador.id,
      email: utilizador.email,
      role: utilizador.role,
    };

    const tokens: AuthTokens = {
      accessToken: gerarAccessToken(tokenPayload),
      refreshToken: gerarRefreshToken(tokenPayload),
    };

    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Refresh token expirado. Faça login novamente." });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Refresh token inválido" });
      return;
    }

    console.error("Erro ao renovar token:", error);
    res.status(500).json({ error: "Erro ao renovar token" });
  }
}

/**
 * GET /api/auth/perfil
 * Obter perfil do utilizador autenticado
 */
export async function obterPerfil(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const utilizador = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
    });

    if (!utilizador) {
      res.status(404).json({ error: "Utilizador não encontrado" });
      return;
    }

    res.json({
      success: true,
      data: utilizador,
    });
  } catch (error) {
    console.error("Erro ao obter perfil:", error);
    res.status(500).json({ error: "Erro ao obter perfil" });
  }
}
