import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { gerarSlug } from "../utils/helpers";

const criarCategoriaSchema = z.object({
  nome: z.string().min(2).max(255),
  descricao: z.string().optional(),
  imagemUrl: z.string().url().optional(),
  categoriaPaiId: z.string().optional().nullable(),
});

export async function listarCategorias(_req: Request, res: Response): Promise<void> {
  try {
    const categorias = await prisma.category.findMany({
      where: { ativo: true },
      include: {
        subcategorias: {
          where: { ativo: true },
          select: { id: true, nome: true, slug: true },
        },
        _count: { select: { products: true } },
      },
      orderBy: { nome: "asc" },
    });

    // Só categorias raiz (sem pai)
    const categoriasRaiz = categorias.filter((c) => !c.categoriaPaiId);
    const subcategorias = categorias.filter((c) => c.categoriaPaiId);

    // Associar subcategorias às categorias pai
    const resultado = categoriasRaiz.map((cat) => ({
      ...cat,
      subcategorias: subcategorias.filter((s) => s.categoriaPaiId === cat.id),
    }));

    res.json(resultado);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
}

export async function criarCategoria(req: Request, res: Response): Promise<void> {
  try {
    const dados = criarCategoriaSchema.parse(req.body);

    const slug = gerarSlug(dados.nome);
    const existente = await prisma.category.findUnique({ where: { slug } });
    if (existente) {
      res.status(409).json({ error: "Já existe uma categoria com este nome" });
      return;
    }

    const categoria = await prisma.category.create({
      data: {
        nome: dados.nome,
        slug,
        descricao: dados.descricao,
        imagemUrl: dados.imagemUrl,
        categoriaPaiId: dados.categoriaPaiId || null,
      },
    });

    res.status(201).json(categoria);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ error: "Erro ao criar categoria" });
  }
}

export async function atualizarCategoria(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const dados = req.body;

    const categoria = await prisma.category.update({
      where: { id },
      data: {
        nome: dados.nome || undefined,
        slug: dados.nome ? gerarSlug(dados.nome) : undefined,
        descricao: dados.descricao || undefined,
        imagemUrl: dados.imagemUrl || undefined,
        categoriaPaiId: dados.categoriaPaiId !== undefined ? dados.categoriaPaiId : undefined,
        ativo: dados.ativo !== undefined ? dados.ativo : undefined,
      },
    });

    res.json(categoria);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
}

export async function eliminarCategoria(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params as { id: string };

    // Verificar se tem produtos associados
    const produtos = await prisma.product.count({ where: { categoryId: id } });
    if (produtos > 0) {
      res.status(400).json({
        error: `Não é possível eliminar: ${produtos} produto(s) associado(s) a esta categoria`,
      });
      return;
    }

    await prisma.category.delete({ where: { id } });
    res.json({ message: "Categoria eliminada com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar categoria:", error);
    res.status(500).json({ error: "Erro ao eliminar categoria" });
  }
}
