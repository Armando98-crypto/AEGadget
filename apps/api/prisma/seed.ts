import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed inicial da base de dados — AE Gadget
 *
 * Cria:
 * 1. Admin utilizador
 * 2. Vendedor AEGADGET
 * 3. Categorias base
 *
 * Para executar: npx prisma db seed
 */
async function main() {
  console.log("A iniciar o seed da base de dados...");

  // ============================================
  // 1. UTILIZADOR ADMIN
  // ============================================
  const adminPasswordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@aegadget.co.ao" },
    update: {},
    create: {
      nome: "Administrador AE Gadget",
      email: "admin@aegadget.co.ao",
      telefone: "+244923456789",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("Admin criado:", admin.email);

  // ============================================
  // 2. VENDEDOR AEGADGET
  // ============================================
  const vendorUser = await prisma.user.upsert({
    where: { email: "vendedor@aegadget.co.ao" },
    update: {},
    create: {
      nome: "AE Gadget - Vendedor",
      email: "vendedor@aegadget.co.ao",
      telefone: "+244923456790",
      passwordHash: adminPasswordHash, // Mesma password para facilitar dev
      role: UserRole.VENDOR,
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      nome: "AE Gadget",
      descricao:
        "A sua loja de gadgets e eletrónica em Lubango, Angola. Os melhores preços em smartphones, acessórios e muito mais.",
      userId: vendorUser.id,
      verificado: true,
    },
  });

  console.log("Vendedor AEGADGET criado:", vendor.nome);

  // ============================================
  // 3. CATEGORIAS BASE
  // ============================================
  const categorias = [
    { nome: "Eletrónica", slug: "eletronica" },
    { nome: "Smartphones", slug: "smartphones" },
    { nome: "Acessórios", slug: "acessorios" },
    { nome: "Áudio", slug: "audio" },
    { nome: "Computadores", slug: "computadores" },
    { nome: "Redes", slug: "redes" },
    { nome: "Casa Inteligente", slug: "casa-inteligente" },
  ];

  for (const cat of categorias) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log(`${categorias.length} categorias criadas`);

  // ============================================
  // 4. CLIENTE DE TESTE
  // ============================================
  const clientePasswordHash = await bcrypt.hash("cliente123", 12);

  await prisma.user.upsert({
    where: { email: "cliente@teste.com" },
    update: {},
    create: {
      nome: "Cliente de Teste",
      email: "cliente@teste.com",
      telefone: "+244912345678",
      passwordHash: clientePasswordHash,
      role: UserRole.CUSTOMER,
    },
  });

  console.log("Cliente de teste criado: cliente@teste.com");
  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
