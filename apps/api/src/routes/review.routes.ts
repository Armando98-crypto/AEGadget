import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { autenticar } from "../middleware/auth.middleware";

const criarReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional(),
});

const router = Router();

/**
 * POST /api/reviews
 * Criar avaliação (autenticado)
 */
router.post("/", autenticar, async (req: Request, res: Response) => {
  try {
    const dados = criarReviewSchema.parse(req.body);

    // Verificar se o produto existe
    const produto = await prisma.product.findUnique({
      where: { id: dados.productId },
    });
    if (!produto) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    // Verificar se o utilizador já avaliou este produto
    const existente = await prisma.review.findFirst({
      where: {
        productId: dados.productId,
        userId: req.user!.sub,
      },
    });

    if (existente) {
      // Atualizar avaliação existente
      const review = await prisma.review.update({
        where: { id: existente.id },
        data: {
          rating: dados.rating,
          comentario: dados.comentario,
        },
        include: { user: { select: { id: true, nome: true } } },
      });
      res.json(review);
      return;
    }

    // Criar nova avaliação
    const review = await prisma.review.create({
      data: {
        productId: dados.productId,
        userId: req.user!.sub,
        rating: dados.rating,
        comentario: dados.comentario,
      },
      include: { user: { select: { id: true, nome: true } } },
    });

    res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao criar review:", error);
    res.status(500).json({ error: "Erro ao criar avaliação" });
  }
});

/**
 * GET /api/reviews/product/:productId
 * Listar avaliações de um produto (público)
 */
router.get("/product/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params as { productId: string };

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, nome: true } } },
      orderBy: { createdAt: "desc" },
    });

    const media = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    res.json({
      reviews,
      media: media._avg.rating,
      total: (media._count as { rating: number }).rating,
    });
  } catch (error) {
    console.error("Erro ao listar reviews:", error);
    res.status(500).json({ error: "Erro ao listar avaliações" });
  }
});

/**
 * DELETE /api/reviews/:id
 * Eliminar avaliação (próprio utilizador ou admin)
 */
router.delete("/:id", autenticar, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      res.status(404).json({ error: "Avaliação não encontrada" });
      return;
    }

    // Só o autor ou admin pode eliminar
    if (review.userId !== req.user!.sub && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: "Sem permissão" });
      return;
    }

    await prisma.review.delete({ where: { id } });
    res.json({ message: "Avaliação eliminada" });
  } catch (error) {
    console.error("Erro ao eliminar review:", error);
    res.status(500).json({ error: "Erro ao eliminar avaliação" });
  }
});

export default router;
