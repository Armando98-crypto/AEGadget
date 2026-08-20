import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { autenticar, verificarRole } from "../middleware/auth.middleware";

const criarCouponSchema = z.object({
  codigo: z.string().min(3).max(50).toUpperCase(),
  descricao: z.string().optional(),
  tipo: z.enum(["PERCENTAGEM", "VALOR_FIXO", "FRETE_GRATIS"]),
  valor: z.number().min(0),
  valorMinimo: z.number().optional(),
  usoMaximo: z.number().int().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

const router = Router();

/**
 * GET /api/coupons
 * Listar cupões (só ADMIN)
 */
router.get("/", autenticar, verificarRole("ADMIN"), async (_req: Request, res: Response) => {
  try {
    const cupoes = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(cupoes);
  } catch (error) {
    console.error("Erro ao listar cupões:", error);
    res.status(500).json({ error: "Erro ao listar cupões" });
  }
});

/**
 * POST /api/coupons
 * Criar cupão (só ADMIN)
 */
router.post("/", autenticar, verificarRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const dados = criarCouponSchema.parse(req.body);

    // Verificar se o código já existe
    const existente = await prisma.coupon.findUnique({ where: { codigo: dados.codigo } });
    if (existente) {
      res.status(400).json({ error: "Já existe um cupão com este código" });
      return;
    }

    const cupao = await prisma.coupon.create({
      data: {
        codigo: dados.codigo,
        descricao: dados.descricao,
        tipo: dados.tipo,
        valor: dados.valor,
        valorMinimo: dados.valorMinimo,
        usoMaximo: dados.usoMaximo,
        dataInicio: dados.dataInicio ? new Date(dados.dataInicio) : null,
        dataFim: dados.dataFim ? new Date(dados.dataFim) : null,
      },
    });

    res.status(201).json(cupao);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao criar cupão:", error);
    res.status(500).json({ error: "Erro ao criar cupão" });
  }
});

/**
 * DELETE /api/coupons/:id
 * Eliminar cupão (só ADMIN)
 */
router.delete("/:id", autenticar, verificarRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ message: "Cupão eliminado" });
  } catch (error) {
    console.error("Erro ao eliminar cupão:", error);
    res.status(500).json({ error: "Erro ao eliminar cupão" });
  }
});

/**
 * PUT /api/coupons/:id
 * Ativar/desativar cupão (só ADMIN)
 */
router.put("/:id", autenticar, verificarRole("ADMIN"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    const cupao = await prisma.coupon.update({
      where: { id },
      data: { ativo },
    });

    res.json(cupao);
  } catch (error) {
    console.error("Erro ao atualizar cupão:", error);
    res.status(500).json({ error: "Erro ao atualizar cupão" });
  }
});

/**
 * POST /api/coupons/validate
 * Validar cupão e calcular desconto (público, mas requer carrinho)
 */
router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { codigo, total } = req.body;

    if (!codigo) {
      res.status(400).json({ error: "Código do cupão é obrigatório" });
      return;
    }

    const cupao = await prisma.coupon.findUnique({
      where: { codigo: codigo.toUpperCase() },
    });

    if (!cupao) {
      res.status(404).json({ error: "Cupão não encontrado" });
      return;
    }

    if (!cupao.ativo) {
      res.status(400).json({ error: "Cupão inativo" });
      return;
    }

    if (cupao.dataInicio && new Date() < cupao.dataInicio) {
      res.status(400).json({ error: "Cupão ainda não está ativo" });
      return;
    }

    if (cupao.dataFim && new Date() > cupao.dataFim) {
      res.status(400).json({ error: "Cupão expirado" });
      return;
    }

    if (cupao.usoMaximo && cupao.usoAtual >= cupao.usoMaximo) {
      res.status(400).json({ error: "Cupão atingiu o limite de usos" });
      return;
    }

    if (cupao.valorMinimo && Number(total) < Number(cupao.valorMinimo)) {
      res.status(400).json({
        error: `Compra mínima de ${Number(cupao.valorMinimo).toLocaleString("pt-AO")} Kz`,
      });
      return;
    }

    // Calcular desconto
    let desconto = 0;
    if (cupao.tipo === "PERCENTAGEM") {
      desconto = Number(total) * (Number(cupao.valor) / 100);
    } else if (cupao.tipo === "VALOR_FIXO") {
      desconto = Math.min(Number(cupao.valor), Number(total));
    } else if (cupao.tipo === "FRETE_GRATIS") {
      desconto = 0; // Frete já é grátis, mas marca como válido
    }

    res.json({
      valido: true,
      cupao: {
        id: cupao.id,
        codigo: cupao.codigo,
        tipo: cupao.tipo,
        valor: Number(cupao.valor),
        descricao: cupao.descricao,
      },
      desconto: Math.round(desconto * 100) / 100,
    });
  } catch (error) {
    console.error("Erro ao validar cupão:", error);
    res.status(500).json({ error: "Erro ao validar cupão" });
  }
});

export default router;
