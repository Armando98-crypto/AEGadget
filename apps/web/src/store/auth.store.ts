/**
 * Store de autenticação — AE Gadget Frontend
 *
 * Usa Zustand para gerir o estado de autenticação.
 * Persiste tokens no localStorage para sobreviver a refreshes de página.
 *
 * Em Angola, a internet pode cair durante uma sessão,
 * por isso o store trata de renovar tokens automaticamente.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================
// TIPOS
// ============================================

export interface User {
  id: string;
  nome: string;
  email: string;
  role: "CUSTOMER" | "VENDOR" | "ADMIN";
}

interface AuthState {
  // Estado
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Ações
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
}

// ============================================
// STORE
// ============================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Guardar dados de autenticação após login/registo
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      // Terminar sessão
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      // Atualizar tokens (após refresh)
      updateTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),
    }),
    {
      name: "aegadget-auth", // Nome da key no localStorage
      // Só persistir dados sensíveis em produção
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// HELPER PARA OBTER TOKEN ATUAL
// ============================================

/**
 * Obtém o access token atual para usar nas chamadas à API.
 * Útil para chamadas fora do contexto React.
 */
export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}
