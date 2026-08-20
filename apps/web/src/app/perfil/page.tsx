"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import { User, Mail, Phone, Calendar, Shield, ShoppingBag, ChevronRight } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuthStore();

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">O Meu Perfil</h1>

        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600">
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.nome}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                <Shield size={12} />
                {user?.role === "ADMIN" ? "Administrador" : user?.role === "VENDOR" ? "Vendedor" : "Cliente"}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Nome</p>
                <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Telefone</p>
                <p className="text-sm font-medium text-gray-900">
                  {(user as any)?.telefone || "Não registado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Atalhos */}
        <div className="space-y-2">
          <Link
            href="/perfil/encomendas"
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-5 py-4 transition-all hover:border-primary-200 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={18} className="text-primary-500" />
              <span className="font-medium text-gray-900">As Minhas Encomendas</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
