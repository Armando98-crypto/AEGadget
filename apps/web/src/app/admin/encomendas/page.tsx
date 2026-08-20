"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarKwanza, formatarDataHora, nomearEstadoEncomenda } from "@/lib/format";
import {
  Package,
  Search,
  Loader2,
  Eye,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

interface OrderItem {
  id: string;
  quantidade: number;
  precoUnitario: number;
  product: { nome: string };
}

interface Encomenda {
  id: string;
  status: string;
  total: number;
  metodoPagamento: string;
  createdAt: string;
  notas: string | null;
  enderecoEntrega: {
    nome: string;
    telefone: string;
    rua: string;
    bairro: string;
    municipio: string;
    provincia: string;
    referencia?: string;
  };
  items: OrderItem[];
  user: { id: string; nome: string; email: string };
}

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  { value: "CONFIRMADO", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  { value: "EM_SEPARACAO", label: "Em Separação", color: "bg-purple-100 text-purple-800" },
  { value: "ENVIADO", label: "Enviado", color: "bg-indigo-100 text-indigo-800" },
  { value: "ENTREGUE", label: "Entregue", color: "bg-green-100 text-green-800" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-red-100 text-red-800" },
];

const PAYMENT_LABELS: Record<string, string> = {
  REFERENCIA: "Multicaixa Express",
  TRANSFERENCIA: "Transferência Bancária",
  PAGAMENTO_ENTREGA: "Pagamento na Entrega",
};

export default function AdminEncomendasPage() {
  const { accessToken } = useAuthStore();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState("");
  const [encomendaDetalhe, setEncomendaDetalhe] = useState<Encomenda | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  useEffect(() => {
    carregarEncomendas();
  }, []);

  async function carregarEncomendas() {
    setCarregando(true);
    try {
      const data = await apiRequest<Encomenda[]>("/orders", { token: accessToken! });
      setEncomendas(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarEstado(id: string, novoStatus: string) {
    setAtualizando(id);
    try {
      await apiRequest(`/orders/${id}/status`, {
        method: "PUT",
        token: accessToken!,
        body: JSON.stringify({ status: novoStatus }),
      });
      setEncomendas((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: novoStatus } : e))
      );
      if (encomendaDetalhe?.id === id) {
        setEncomendaDetalhe((prev) => (prev ? { ...prev, status: novoStatus } : null));
      }
    } catch (error) {
      if (error instanceof ApiError) alert(error.message);
    } finally {
      setAtualizando(null);
    }
  }

  const encomendasFiltradas = encomendas.filter((e) => {
    if (!filtro) return true;
    return (
      e.status === filtro ||
      e.user.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      e.id.slice(0, 8).includes(filtro)
    );
  });

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Encomendas</h1>
            <p className="text-sm text-gray-500">{encomendas.length} encomenda(s) no total</p>
          </div>
          <button
            onClick={carregarEncomendas}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltro("")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !filtro ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todas ({encomendas.length})
          </button>
          {STATUS_OPTIONS.map((s) => {
            const count = encomendas.filter((e) => e.status === s.value).length;
            return (
              <button
                key={s.value}
                onClick={() => setFiltro(s.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filtro === s.value
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Lista de encomendas */}
        <div className="space-y-3">
          {carregando ? (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
          ) : encomendasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-16">
              <Package size={48} className="mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Nenhuma encomenda encontrada</p>
            </div>
          ) : (
            encomendasFiltradas.map((encomenda) => {
              const statusInfo = STATUS_OPTIONS.find((s) => s.value === encomenda.status);
              return (
                <div
                  key={encomenda.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="font-mono text-xs text-gray-400">
                          #{encomenda.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`badge ${statusInfo?.color}`}>
                          {statusInfo?.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatarDataHora(encomenda.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {encomenda.user.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {encomenda.enderecoEntrega.bairro}, {encomenda.enderecoEntrega.municipio} — {encomenda.items.length} {encomenda.items.length === 1 ? "item" : "itens"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-primary-600">
                        {formatarKwanza(encomenda.total)}
                      </p>

                      {/* Dropdown de estado */}
                      <div className="relative">
                        <select
                          value={encomenda.status}
                          onChange={(e) => atualizarEstado(encomenda.id, e.target.value)}
                          disabled={atualizando === encomenda.id}
                          className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 hover:border-primary-300 focus:border-primary-500 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>

                      <button
                        onClick={() =>
                          setEncomendaDetalhe(
                            encomendaDetalhe?.id === encomenda.id ? null : encomenda
                          )
                        }
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Detalhe expandido */}
                  {encomendaDetalhe?.id === encomenda.id && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Cliente
                          </h4>
                          <p className="text-sm font-medium text-gray-900">{encomenda.user.nome}</p>
                          <p className="text-sm text-gray-600">{encomenda.user.email}</p>
                          <p className="text-sm text-gray-600">{encomenda.enderecoEntrega.telefone}</p>
                        </div>
                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Endereço de Entrega
                          </h4>
                          <p className="text-sm text-gray-600">{encomenda.enderecoEntrega.rua}</p>
                          <p className="text-sm text-gray-600">
                            {encomenda.enderecoEntrega.bairro}, {encomenda.enderecoEntrega.municipio}
                          </p>
                          <p className="text-sm text-gray-600">{encomenda.enderecoEntrega.provincia}</p>
                          {encomenda.enderecoEntrega.referencia && (
                            <p className="text-xs text-gray-400">
                              Ref: {encomenda.enderecoEntrega.referencia}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Itens
                        </h4>
                        <div className="space-y-2">
                          {encomenda.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                            >
                              <span className="text-gray-700">
                                {item.product.nome} × {item.quantidade}
                              </span>
                              <span className="font-medium text-gray-900">
                                {formatarKwanza(item.precoUnitario * item.quantidade)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3">
                        <div>
                          <span className="text-sm text-gray-600">Pagamento: </span>
                          <span className="text-sm font-medium">
                            {PAYMENT_LABELS[encomenda.metodoPagamento] || encomenda.metodoPagamento}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-primary-600">
                          {formatarKwanza(encomenda.total)}
                        </span>
                      </div>

                      {encomenda.notas && (
                        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          <span className="font-medium">Nota: </span>
                          {encomenda.notas}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
