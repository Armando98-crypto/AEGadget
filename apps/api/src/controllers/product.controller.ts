import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { gerarSlug } from "../utils/helpers";

// ============================================
// VALIDAÇÕES
// ============================================

const criarProdutoSchema = z.object({
  nome: z.string().min(2).max(255),
  descricao: z.string().min(10),
  preco: z.number().positive("Preço deve ser positivo"),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().optional().nullable(),
  imagens: z
    .array(
      z.object({
        url: z.string().url(),
        ordem: z.number().int().min(0).default(0),
      })
    )
    .optional()
    .default([]),
});

const listarQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  minPreco: z.coerce.number().optional(),
  maxPreco: z.coerce.number().optional(),
  sortBy: z.enum(["preco", "createdAt", "nome"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  estado: z.enum(["ATIVO", "INATIVO", "ESGOTADO"]).optional(),
});

// ============================================
// CONTROLADORES
// ============================================

/**
 * GET /api/products
 * Listar produtos com paginação, filtro e pesquisa
 */
export async function listarProdutos(req: Request, res: Response): Promise<void> {
  try {
    const query = listarQuerySchema.parse(req.query);

    // Construir filtros
    const where: any = {};

    // Se o utilizador não é admin, só mostrar produtos ativos
    if (!req.user || req.user.role !== "ADMIN") {
      where.estado = "ATIVO";
    } else if (query.estado) {
      where.estado = query.estado;
    }

    // Pesquisa por nome
    if (query.search) {
      where.nome = { contains: query.search, mode: "insensitive" };
    }

    // Filtro por categoria
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Filtro por faixa de preço
    if (query.minPreco !== undefined || query.maxPreco !== undefined) {
      where.preco = {};
      if (query.minPreco !== undefined) where.preco.gte = query.minPreco;
      if (query.maxPreco !== undefined) where.preco.lte = query.maxPreco;
    }

    // Contar total
    const total = await prisma.product.count({ where });

    // Buscar produtos
    const produtos = await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { ordem: "asc" }, take: 1 },
        category: { select: { id: true, nome: true, slug: true } },
        vendor: { select: { id: true, nome: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    // Calcular média de avaliação para cada produto
    const produtosComMedia = await Promise.all(
      produtos.map(async (p) => {
        const avaliacao = await prisma.review.aggregate({
          where: { productId: p.id },
          _avg: { rating: true },
        });
        return {
          ...p,
          mediaAvaliacao: avaliacao._avg.rating,
        };
      })
    );

    res.json({
      data: produtosComMedia,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Parâmetros inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
}

/**
 * GET /api/products/:slug
 * Obter produto por slug
 */
export async function obterProduto(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params as { slug: string };

    const produto = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { ordem: "asc" } },
        category: { select: { id: true, nome: true, slug: true } },
        vendor: { select: { id: true, nome: true, logoUrl: true } },
        reviews: {
          include: {
            user: { select: { id: true, nome: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!produto) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    // Média de avaliação
    const avaliacao = await prisma.review.aggregate({
      where: { productId: produto.id },
      _avg: { rating: true },
    });

    res.json({
      ...produto,
      mediaAvaliacao: avaliacao._avg.rating,
    });
  } catch (error) {
    console.error("Erro ao obter produto:", error);
    res.status(500).json({ error: "Erro ao obter produto" });
  }
}

/**
 * POST /api/products
 * Criar produto (ADMIN ou VENDOR)
 */
export async function criarProduto(req: Request, res: Response): Promise<void> {
  try {
    const dados = criarProdutoSchema.parse(req.body);

    // Gerar slug único
    let slug = gerarSlug(dados.nome);
    const existente = await prisma.product.findUnique({ where: { slug } });
    if (existente) {
      slug = `${slug}-${Date.now()}`;
    }

    // Obter vendor_id do utilizador autenticado
    let vendorId: string;

    if (req.user!.role === "ADMIN") {
      // Admin pode escolher qualquer vendor
      const vendor = await prisma.vendor.findFirst({ where: { ativo: true } });
      if (!vendor) {
        res.status(400).json({ error: "Nenhum vendedor ativo encontrado" });
        return;
      }
      vendorId = vendor.id;
    } else {
      // Vendedor só pode criar produtos no seu próprio vendor
      const vendor = await prisma.vendor.findUnique({
        where: { userId: req.user!.sub },
      });
      if (!vendor) {
        res.status(400).json({ error: "Perfil de vendedor não encontrado" });
        return;
      }
      vendorId = vendor.id;
    }

    const produto = await prisma.product.create({
      data: {
        nome: dados.nome,
        slug,
        descricao: dados.descricao,
        preco: dados.preco,
        stock: dados.stock,
        vendorId,
        categoryId: dados.categoryId || null,
        estado: dados.stock > 0 ? "ATIVO" : "ESGOTADO",
        images: {
          create: dados.imagens.map((img) => ({
            url: img.url,
            ordem: img.ordem,
          })),
        },
      },
      include: {
        images: true,
        category: true,
        vendor: true,
      },
    });

    res.status(201).json(produto);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
}

/**
 * PUT /api/products/:id
 * Atualizar produto
 */
export async function atualizarProduto(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const dados = req.body;

    // Verificar se o produto existe
    const existente = await prisma.product.findUnique({ where: { id } });
    if (!existente) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    const { imagens, ...dadosProduto } = dados;

    // Atualizar slug se o nome mudou
    let slug = existente.slug;
    if (dadosProduto.nome && dadosProduto.nome !== existente.nome) {
      slug = gerarSlug(dadosProduto.nome);
      const slugExistente = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExistente) slug = `${slug}-${Date.now()}`;
    }

    // Atualizar imagens se fornecidas
    let updateData: any = {
      nome: dadosProduto.nome || undefined,
      slug,
      descricao: dadosProduto.descricao || undefined,
      preco: dadosProduto.preco !== undefined ? dadosProduto.preco : undefined,
      stock: dadosProduto.stock !== undefined ? dadosProduto.stock : undefined,
      categoryId: dadosProduto.categoryId !== undefined ? dadosProduto.categoryId : undefined,
      estado: dadosProduto.estado || undefined,
    };

    if (imagens) {
      // Deletar imagens existentes e criar novas
      await prisma.productImage.deleteMany({ where: { productId: id } });
      updateData.images = {
        create: imagens.map((img: { url: string; ordem: number }) => ({
          url: img.url,
          ordem: img.ordem,
        })),
      };
    }

    const produto = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: true,
        category: true,
        vendor: true,
      },
    });

    res.json(produto);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
}

/**
 * DELETE /api/products/:id
 * Eliminar produto (só ADMIN)
 */
export async function eliminarProduto(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    const existente = await prisma.product.findUnique({ where: { id } });
    if (!existente) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    await prisma.product.delete({ where: { id } });

    res.json({ message: "Produto eliminado com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar produto:", error);
    res.status(500).json({ error: "Erro ao eliminar produto" });
  }
}
