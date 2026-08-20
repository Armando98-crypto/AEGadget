import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";

const adicionarItemSchema = z.object({
  productId: z.string(),
  quantidade: z.number().int().min(1).default(1),
});

const atualizarQuantidadeSchema = z.object({
  quantidade: z.number().int().min(1),
});

/**
 * GET /api/cart
 * Obter carrinho do utilizador autenticado
 */
export async function obterCarrinho(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;

    let carrinho = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { ordem: "asc" }, take: 1 },
                vendor: { select: { id: true, nome: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Se não existe carrinho, criar um vazio
    if (!carrinho) {
      carrinho = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { ordem: "asc" }, take: 1 },
                  vendor: { select: { id: true, nome: true } },
                },
              },
            },
          },
        },
      });
    }

    // Calcular total
    const total = carrinho.items.reduce((acc, item) => {
      return acc + Number(item.product.preco) * item.quantidade;
    }, 0);

    res.json({
      ...carrinho,
      total,
      itemCount: carrinho.items.length,
    });
  } catch (error) {
    console.error("Erro ao obter carrinho:", error);
    res.status(500).json({ error: "Erro ao obter carrinho" });
  }
}

/**
 * POST /api/cart/items
 * Adicionar item ao carrinho
 */
export async function adicionarItem(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const dados = adicionarItemSchema.parse(req.body);

    // Verificar se o produto existe e tem stock
    const produto = await prisma.product.findUnique({
      where: { id: dados.productId },
    });

    if (!produto) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    if (produto.estado !== "ATIVO") {
      res.status(400).json({ error: "Produto não disponível" });
      return;
    }

    if (produto.stock < dados.quantidade) {
      res.status(400).json({ error: "Stock insuficiente" });
      return;
    }

    // Garantir que o carrinho existe
    let carrinho = await prisma.cart.findUnique({ where: { userId } });
    if (!carrinho) {
      carrinho = await prisma.cart.create({ data: { userId } });
    }

    // Verificar se o item já existe no carrinho
    const itemExistente = await prisma.cartItem.findFirst({
      where: {
        cartId: carrinho.id,
        productId: dados.productId,
      },
    });

    if (itemExistente) {
      // Atualizar quantidade
      const novaQuantidade = itemExistente.quantidade + dados.quantidade;

      if (novaQuantidade > produto.stock) {
        res.status(400).json({ error: "Stock insuficiente para esta quantidade" });
        return;
      }

      const item = await prisma.cartItem.update({
        where: { id: itemExistente.id },
        data: { quantidade: novaQuantidade },
        include: {
          product: {
            include: { images: { orderBy: { ordem: "asc" }, take: 1 } },
          },
        },
      });

      res.json(item);
    } else {
      // Criar novo item
      const item = await prisma.cartItem.create({
        data: {
          cartId: carrinho.id,
          productId: dados.productId,
          quantidade: dados.quantidade,
        },
        include: {
          product: {
            include: { images: { orderBy: { ordem: "asc" }, take: 1 } },
          },
        },
      });

      res.status(201).json(item);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao adicionar item:", error);
    res.status(500).json({ error: "Erro ao adicionar item ao carrinho" });
  }
}

/**
 * PUT /api/cart/items/:id
 * Atualizar quantidade de um item
 */
export async function atualizarQuantidade(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const dados = atualizarQuantidadeSchema.parse(req.body);

    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { product: true, cart: true },
    });

    if (!item || item.cart.userId !== req.user!.sub) {
      res.status(404).json({ error: "Item não encontrado" });
      return;
    }

    if (dados.quantidade > item.product.stock) {
      res.status(400).json({ error: "Stock insuficiente" });
      return;
    }

    const itemAtualizado = await prisma.cartItem.update({
      where: { id },
      data: { quantidade: dados.quantidade },
      include: {
        product: {
          include: { images: { orderBy: { ordem: "asc" }, take: 1 } },
        },
      },
    });

    res.json(itemAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar quantidade:", error);
    res.status(500).json({ error: "Erro ao atualizar quantidade" });
  }
}

/**
 * DELETE /api/cart/items/:id
 * Remover item do carrinho
 */
export async function removerItem(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const item = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== req.user!.sub) {
      res.status(404).json({ error: "Item não encontrado" });
      return;
    }

    await prisma.cartItem.delete({ where: { id } });

    res.json({ message: "Item removido do carrinho" });
  } catch (error) {
    console.error("Erro ao remover item:", error);
    res.status(500).json({ error: "Erro ao remover item" });
  }
}

/**
 * DELETE /api/cart
 * Limpar carrinho (remover todos os itens)
 */
export async function limparCarrinho(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;

    const carrinho = await prisma.cart.findUnique({ where: { userId } });
    if (carrinho) {
      await prisma.cartItem.deleteMany({ where: { cartId: carrinho.id } });
    }

    res.json({ message: "Carrinho limpo com sucesso" });
  } catch (error) {
    console.error("Erro ao limpar carrinho:", error);
    res.status(500).json({ error: "Erro ao limpar carrinho" });
  }
}
