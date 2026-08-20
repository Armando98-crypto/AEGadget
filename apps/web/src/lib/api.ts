/**
 * Cliente HTTP para comunicar com a API — AE Gadget Frontend
 *
 * Este módulo centraliza todas as chamadas à API.
 * Lida automaticamente com:
 * - Retry em caso de erro de rede (importante para Angola)
 * - Headers de autenticação
 * - Formatação de erros
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface RequestOptions extends RequestInit {
  token?: string;
  isFormData?: boolean;
}

/**
 * Função base para fazer requests à API.
 *
 * Em Angola a internet pode ser instável, por isso fazemos
 * retry automático em caso de erro de rede.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, isFormData, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Só adicionar Content-Type JSON se não for FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // Adicionar token de autenticação se fornecido
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_URL}${endpoint}`;

  // Retry para lidar com internet instável
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Se não for JSON, retornar erro genérico
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Resposta inesperada do servidor");
      }

      const data = await response.json();

      // Se a resposta não for OK, lançar erro
      if (!response.ok) {
        throw new ApiError(
          data.error || "Erro desconhecido",
          response.status,
          data.details
        );
      }

      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Não fazer retry em erros de validação ou autorização
      if (error instanceof ApiError && error.status < 500) {
        throw error;
      }

      // Se for o último attempt, lançar o erro
      if (attempt === maxRetries) {
        throw error;
      }

      // Esperar antes de retry (backoff exponencial)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }

  throw lastError;
}

/**
 * Classe de erro personalizada para erros da API
 */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// ============================================
// FUNÇÕES DE API POR DOMÍNIO
// ============================================

/**
 * Autenticação
 */
export const authApi = {
  registar: (dados: {
    nome: string;
    email: string;
    telefone?: string;
    password: string;
    confirmPassword: string;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      data: { utilizador: unknown; accessToken: string; refreshToken: string };
    }>("/auth/registar", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  login: (dados: { email: string; password: string }) =>
    apiRequest<{
      success: boolean;
      data: { utilizador: unknown; accessToken: string; refreshToken: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(dados),
    }),

  refreshToken: (refreshToken: string) =>
    apiRequest<{
      data: { accessToken: string; refreshToken: string };
    }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  obterPerfil: (token: string) =>
    apiRequest<{ success: boolean; data: unknown }>("/auth/perfil", {
      token,
    }),
};
