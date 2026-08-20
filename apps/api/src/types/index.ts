/**
 * Tipos partilhados — AE Gadget
 *
 * Estes tipos são usados tanto na API como no frontend.
 * Quando o Prisma Client for gerado, estes tipos podem ser
 * complementados com os tipos gerados automaticamente.
 */

// ============================================
// TIPOS DE AUTENTICAÇÃO
// ============================================

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ============================================
// TIPOS DE UTILIZADOR
// ============================================

export enum UserRole {
  CUSTOMER = "CUSTOMER",
  VENDOR = "VENDOR",
  ADMIN = "ADMIN",
}

// ============================================
// TIPOS DE PRODUTO
// ============================================

export enum ProductState {
  ATIVO = "ATIVO",
  INATIVO = "INATIVO",
  ESGOTADO = "ESGOTADO",
}

export interface ProductWithImages {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  preco: number;
  stock: number;
  estado: ProductState;
  images: {
    id: string;
    url: string;
    ordem: number;
  }[];
  category?: {
    id: string;
    nome: string;
    slug: string;
  } | null;
  vendor: {
    id: string;
    nome: string;
  };
  _count?: {
    reviews: number;
  };
  mediaAvaliacao?: number;
}

// ============================================
// TIPOS DE ENCOMENDA
// ============================================

export enum OrderStatus {
  PENDENTE = "PENDENTE",
  CONFIRMADO = "CONFIRMADO",
  EM_SEPARACAO = "EM_SEPARACAO",
  ENVIADO = "ENVIADO",
  ENTREGUE = "ENTREGUE",
  CANCELADO = "CANCELADO",
}

export enum PaymentMethod {
  REFERENCIA = "REFERENCIA",
  TRANSFERENCIA = "TRANSFERENCIA",
  PAGAMENTO_ENTREGA = "PAGAMENTO_ENTREGA",
}

export interface EnderecoEntrega {
  nome: string;
  telefone: string;
  rua: string;
  bairro: string;
  municipio: string;
  provincia: string;
  referencia?: string;
}

// ============================================
// TIPOS DE API (REQUEST/RESPONSE)
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
