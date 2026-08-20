"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest } from "@/lib/api";
import { formatarKwanza } from "@/lib/format";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  LayoutGrid,
  AlertTriangle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DashboardData {
  totalProdutos: number;
  totalEncomendas: number;
  encomendasPendentes: number;
  encomendasEntregues: number;
  encomendasCanceladas: number;
  totalVendas: number;
  produtosStockBaixo: number;
}

export default function AdminPage() {
  const { user, accessToken } = useAuthStore();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    async function carregarDashboard() {
      try {
        const [produtosRes, encomendasRes] = await Promise.all([
          apiRequest<{ data: any[]; total: number }>("/products?limit=100&estado=ATIVO", { token: accessToken! }),
          apiRequest<any[]>("/orders", { token: accessToken! }),
        ]);

        const produtos = produtosRes.data || [];
        const encomendas = encomendasRes as any[];

        const totalVendas = encomendas
          .filter((e: any) => e.status !== "CANCELADO")
          .reduce((acc: number, e: any) => acc + e.total, 0);

        setStats({
          totalProdutos: produtosRes.total,
          totalEncomendas: encomendas.length,
          encomendasPendentes: encomendas.filter((e: any) => e.status === "PENDENTE").length,
          encomendasEntregues: encomendas.filter((e: any) => e.status === "ENTREGUE").length,
          encomendasCanceladas: encomendas.filter((e: any) => e.status === "CANCELADO").length,
          totalVendas,
          produtosStockBaixo: produtos.filter((p: any) => p.stock <= 5 && p.stock > 0).length,
        });
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, [accessToken]);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
          <p className="text-sm text-gray-500">
            Bem-vindo, {user?.nome}. Aqui pode gerir a sua loja.
          </p>
        </div>

        {carregando ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : stats && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {formatarKwanza(stats.totalVendas)}
                </p>
                <p className="text-sm text-gray-500">Total de Vendas</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                    <Clock size={20} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">{stats.encomendasPendentes}</p>
                <p className="text-sm text-gray-500">Encomendas Pendentes</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-500">
                    <Package size={20} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">{stats.totalProdutos}</p>
                <p className="text-sm text-gray-500">Produtos Ativos</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                    <ShoppingCart size={20} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">{stats.totalEncomendas}</p>
                <p className="text-sm text-gray-500">Total Encomendas</p>
              </div>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <CheckCircle size={18} className="text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{stats.encomendasEntregues}</p>
                  <p className="text-xs text-gray-500">Encomendas Entregues</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <XCircle size={18} className="text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{stats.encomendasCanceladas}</p>
                  <p className="text-xs text-gray-500">Encomendas Canceladas</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
                <AlertTriangle size={18} className="text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{stats.produtosStockBaixo}</p>
                  <p className="text-xs text-gray-500">Produtos com Stock Baixo</p>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Link
                href="/admin/produtos"
                className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-500">
                  <Package size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Produtos</h3>
                  <p className="text-sm text-gray-500">Criar, editar, gerir</p>
                </div>
                <ArrowUpRight size={18} className="text-gray-300 group-hover:text-primary-500" />
              </Link>

              <Link
                href="/admin/encomendas"
                className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <ShoppingCart size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Encomendas</h3>
                  <p className="text-sm text-gray-500">Gerir estado e detalhes</p>
                </div>
                <ArrowUpRight size={18} className="text-gray-300 group-hover:text-primary-500" />
              </Link>

              <Link
                href="/admin/categorias"
                className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-all hover:border-primary-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                  <LayoutGrid size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600">Categorias</h3>
                  <p className="text-sm text-gray-500">Organizar catálogo</p>
                </div>
                <ArrowUpRight size={18} className="text-gray-300 group-hover:text-primary-500" />
              </Link>
            </div>

            {/* Alertas */}
            {stats.produtosStockBaixo > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle size={20} className="mt-0.5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Stock Baixo</p>
                  <p className="text-sm text-amber-600">
                    {stats.produtosStockBaixo} produto(s) com stock baixo (5 ou menos unidades).
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
