import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import categoryRoutes from "./routes/category.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import uploadRoutes from "./routes/upload.routes";
import reviewRoutes from "./routes/review.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import couponRoutes from "./routes/coupon.routes";

// Inicializar Prisma Client (uma instância global)
export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.API_PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// CORS — permitir ligações do frontend Next.js
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Parsing de JSON no body das requests
app.use(express.json({ limit: "10mb" }));

// Parsing de URL-encoded forms
app.use(express.urlencoded({ extended: true }));

// Servir imagens uploadadas
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// ============================================
// ROTAS
// ============================================

// Health check — útil para verificar se a API está a funcionar
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "AE Gadget API está a funcionar!",
  });
});

// Rotas de autenticação (registo, login, refresh token)
app.use("/api/auth", authRoutes);

// Rotas de produtos
app.use("/api/products", productRoutes);

// Rotas de categorias
app.use("/api/categories", categoryRoutes);

// Rotas do carrinho
app.use("/api/cart", cartRoutes);

// Rotas de encomendas
app.use("/api/orders", orderRoutes);

// Rotas de upload de imagens
app.use("/api/upload", uploadRoutes);

// Rotas de avaliações
app.use("/api/reviews", reviewRoutes);

// Rotas de favoritos
app.use("/api/wishlist", wishlistRoutes);

// Rotas de cupões
app.use("/api/coupons", couponRoutes);

// ============================================
// MIDDLEWARE DE ERROS
// ============================================

// Rota não encontrada (404)
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

// Middleware global de tratamento de erros
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Erro não tratado:", err);

    // Em produção, não expor detalhes do erro ao cliente
    const message =
      process.env.NODE_ENV === "production"
        ? "Erro interno do servidor"
        : err.message;

    res.status(500).json({ error: message });
  }
);

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

async function startServer() {
  try {
    // Verificar ligação à base de dados
    await prisma.$connect();
    console.log("Ligação à base de dados estabelecida com sucesso!");

    app.listen(PORT, () => {
      console.log(`Servidor AE Gadget a funcionar na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
}

// Tratar encerramento gracioso
process.on("SIGTERM", async () => {
  console.log("A encerrar o servidor...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
