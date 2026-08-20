import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../server";
import {
  enviarEmail,
  emailConfirmacaoEncomenda,
  emailAtualizacaoEstado,
} from "../services/email.service";

const criarEncomendaSchema = z.object({
  enderecoEntrega: z.object({
    nome: z.string(),
    telefone: z.string(),
    rua: z.string(),
    bairro: z.string(),
    municipio: z.string(),
    provincia: z.string(),
    referencia: z.string().optional(),
  }),
  metodoPagamento: z.enum(["REFERENCIA", "TRANSFERENCIA", "PAGAMENTO_ENTREGA"]),
  notas: z.string().optional(),
  cupaoCodigo: z.string().optional(),
});

const atualizarEstadoSchema = z.object({
  status: z.enum(["PENDENTE", "CONFIRMADO", "EM_SEPARACAO", "ENVIADO", "ENTREGUE", "CANCELADO"]),
});

/**
 * POST /api/orders
 * Criar encomenda a partir do carrinho
 */
export async function criarEncomenda(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const dados = criarEncomendaSchema.parse(req.body);

    // Obter carrinho com itens
    const carrinho = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!carrinho || carrinho.items.length === 0) {
      res.status(400).json({ error: "Carrinho vazio" });
      return;
    }

    // Verificar stock de todos os itens
    for (const item of carrinho.items) {
      if (item.product.stock < item.quantidade) {
        res.status(400).json({
          error: `Stock insuficiente para "${item.product.nome}". Disponível: ${item.product.stock}`,
        });
        return;
      }
    }

    // Calcular total
    const subtotal = carrinho.items.reduce((acc, item) => {
      return acc + Number(item.product.preco) * item.quantidade;
    }, 0);

    // Aplicar cupão se fornecido
    let desconto = 0;
    let couponId: string | null = null;

    if (dados.cupaoCodigo) {
      const cupao = await prisma.coupon.findUnique({
        where: { codigo: dados.cupaoCodigo.toUpperCase() },
      });

      if (cupao && cupao.ativo) {
        if (cupao.tipo === "PERCENTAGEM") {
          desconto = subtotal * (Number(cupao.valor) / 100);
        } else if (cupao.tipo === "VALOR_FIXO") {
          desconto = Math.min(Number(cupao.valor), subtotal);
        }
        couponId = cupao.id;
      }
    }

    const total = subtotal - desconto;

    // Usar o primeiro vendor (na fase 1, só AEGADGET)
    const vendorId = carrinho.items[0].product.vendorId;

    // Criar encomenda com transação
    const encomenda = await prisma.$transaction(async (tx) => {
      // Criar a encomenda
      const order = await tx.order.create({
        data: {
          userId,
          vendorId,
          total,
          desconto: desconto > 0 ? desconto : null,
          couponId,
          metodoPagamento: dados.metodoPagamento,
          enderecoEntrega: dados.enderecoEntrega as any,
          notas: dados.notas,
          status: "PENDENTE",
          items: {
            create: carrinho.items.map((item) => ({
              productId: item.product.id,
              quantidade: item.quantidade,
              precoUnitario: item.product.preco,
            })),
          },
        },
        include: {
          items: {
            include: { product: { select: { nome: true, slug: true } } },
          },
        },
      });

      // Atualizar uso do cupão
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usoAtual: { increment: 1 } },
        });
      }

      // Atualizar stock dos produtos
      for (const item of carrinho.items) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantidade },
          },
        });
      }

      // Limpar carrinho
      await tx.cartItem.deleteMany({ where: { cartId: carrinho.id } });

      return order;
    });

    // Enviar email de confirmação (não bloquear a resposta)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      const endereco = dados.enderecoEntrega;
      const metodoLabels: Record<string, string> = {
        REFERENCIA: "Multicaixa Express",
        TRANSFERENCIA: "Transferência Bancária",
        PAGAMENTO_ENTREGA: "Pagamento na Entrega",
      };

      enviarEmail({
        to: user.email,
        subject: `AE Gadget — Encomenda #${encomenda.id.slice(-8).toUpperCase()} Confirmada`,
        html: emailConfirmacaoEncomenda({
          nome: user.nome,
          email: user.email,
          encomendaId: encomenda.id,
          itens: encomenda.items.map((item) => ({
            nome: item.product.nome,
            quantidade: item.quantidade,
            preco: Number(item.precoUnitario) * item.quantidade,
          })),
          total,
          endereco: `${endereco.rua}, ${endereco.bairro}, ${endereco.municipio} — ${endereco.provincia}`,
          metodoPagamento: metodoLabels[dados.metodoPagamento] || dados.metodoPagamento,
        }),
      }).catch((err) => console.error("Erro ao enviar email:", err));
    }

    res.status(201).json({
      message: "Encomenda criada com sucesso!",
      encomenda,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao criar encomenda:", error);
    res.status(500).json({ error: "Erro ao criar encomenda" });
  }
}

/**
 * GET /api/orders
 * Listar encomendas
 */
export async function listarEncomendas(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.sub;
    const role = req.user!.role;

    // ADMIN vê todas, CLIENTE vê só as suas
    const where = role === "ADMIN" ? {} : { userId };

    const encomendas = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { nome: true, slug: true, imagemUrl: false },
            },
          },
        },
        user: { select: { id: true, nome: true, email: true } },
        vendor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(encomendas);
  } catch (error) {
    console.error("Erro ao listar encomendas:", error);
    res.status(500).json({ error: "Erro ao listar encomendas" });
  }
}

/**
 * GET /api/orders/:id
 * Obter detalhe de uma encomenda
 */
export async function obterEncomenda(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    const role = req.user!.role;

    const encomenda = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { nome: true, slug: true },
            },
          },
        },
        user: { select: { id: true, nome: true, email: true, telefone: true } },
        vendor: { select: { id: true, nome: true } },
      },
    });

    if (!encomenda) {
      res.status(404).json({ error: "Encomenda não encontrada" });
      return;
    }

    // Verificar permissão (só o dono ou admin pode ver)
    if (role !== "ADMIN" && encomenda.userId !== userId) {
      res.status(403).json({ error: "Sem permissão" });
      return;
    }

    res.json(encomenda);
  } catch (error) {
    console.error("Erro ao obter encomenda:", error);
    res.status(500).json({ error: "Erro ao obter encomenda" });
  }
}

/**
 * PUT /api/orders/:id/status
 * Atualizar estado da encomenda (só ADMIN)
 */
export async function atualizarEstado(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const dados = atualizarEstadoSchema.parse(req.body);

    const encomenda = await prisma.order.findUnique({ where: { id } });
    if (!encomenda) {
      res.status(404).json({ error: "Encomenda não encontrada" });
      return;
    }

    const atualizada = await prisma.order.update({
      where: { id },
      data: { status: dados.status },
      include: {
        items: { include: { product: { select: { nome: true } } } },
        user: { select: { nome: true, email: true } },
      },
    });

    // Enviar email de atualização de estado
    const estadoMensagens: Record<string, string> = {
      CONFIRMADO: "A sua encomenda foi confirmada e está a ser preparada.",
      EM_SEPARACAO: "A sua encomenda está a ser separada para envio.",
      ENVIADO: "A sua encomenda foi enviada e está a caminho!",
      ENTREGUE: "A sua encomenda foi entregue com sucesso!",
      CANCELADO: "A sua encomenda foi cancelada.",
    };

    if (atualizada.user.email && estadoMensagens[dados.status]) {
      enviarEmail({
        to: atualizada.user.email,
        subject: `AE Gadget — Encomenda #${id.slice(-8).toUpperCase()} — ${dados.status}`,
        html: emailAtualizacaoEstado({
          nome: atualizada.user.nome,
          encomendaId: id,
          estado: dados.status.replace("_", " "),
          mensagem: estadoMensagens[dados.status],
        }),
      }).catch((err) => console.error("Erro ao enviar email:", err));
    }

    res.json(atualizada);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Dados inválidos", details: error.errors });
      return;
    }
    console.error("Erro ao atualizar estado:", error);
    res.status(500).json({ error: "Erro ao atualizar estado" });
  }
}
