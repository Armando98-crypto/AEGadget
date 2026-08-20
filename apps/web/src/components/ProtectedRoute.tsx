"use client";

import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * Componente que protege rotas autenticadas.
 *
 * Se o utilizador não estiver autenticado, redireciona para /login.
 * Se uma role específica for exigida e o utilizador não tiver, redireciona para /
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "CUSTOMER" | "VENDOR" | "ADMIN";
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Se precisa de uma role específica e não a tem
    if (requiredRole && user?.role !== requiredRole) {
      router.push("/");
      return;
    }
  }, [isAuthenticated, user, requiredRole, router]);

  // Enquanto verifica, mostrar loading
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary-600" />
          <p className="text-sm text-gray-500">A verificar autenticação...</p>
        </div>
      </div>
    );
  }

  // Se precisa de role específica e não a tem
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Acesso Negado
          </h1>
          <p className="text-gray-600">
            Não tem permissão para aceder a esta página.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
