import { Router, Request, Response } from "express";
import { prisma } from "../server";
import { autenticar } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /api/wishlist
 * Listar favoritos do utilizador
 */
router.get("/", autenticar, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;

    const favoritos = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { orderBy: { ordem: "asc" }, take: 1 },
            category: { select: { id: true, nome: true, slug: true } },
            vendor: { select: { id: true, nome: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular média de avaliação para cada produto
    const favoritosComMedia = await Promise.all(
      favoritos.map(async (fav) => {
        const avaliacao = await prisma.review.aggregate({
          where: { productId: fav.product.id },
          _avg: { rating: true },
        });
        return {
          ...fav,
          product: {
            ...fav.product,
            mediaAvaliacao: avaliacao._avg.rating,
          },
        };
      })
    );

    res.json(favoritosComMedia);
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    res.status(500).json({ error: "Erro ao listar favoritos" });
  }
});

/**
 * POST /api/wishlist/:productId
 * Adicionar/remover produto dos favoritos (toggle)
 */
router.post("/:productId", autenticar, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { productId } = req.params;

    // Verificar se o produto existe
    const produto = await prisma.product.findUnique({ where: { id: productId } });
    if (!produto) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    // Verificar se já existe nos favoritos
    const existente = await prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existente) {
      // Remover dos favoritos
      await prisma.wishlist.delete({ where: { id: existente.id } });
      res.json({ favoritado: false });
    } else {
      // Adicionar aos favoritos
      await prisma.wishlist.create({
        data: { userId, productId },
      });
      res.json({ favoritado: true });
    }
  } catch (error) {
    console.error("Erro ao atualizar favorito:", error);
    res.status(500).json({ error: "Erro ao atualizar favorito" });
  }
});

/**
 * GET /api/wishlist/check/:productId
 * Verificar se um produto está nos favoritos
 */
router.get("/check/:productId", autenticar, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { productId } = req.params;

    const existente = await prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    res.json({ favoritado: !!existente });
  } catch (error) {
    console.error("Erro ao verificar favorito:", error);
    res.status(500).json({ error: "Erro ao verificar favorito" });
  }
});

export default router;
