"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest } from "@/lib/api";
import { formatarKwanza, formatarDataHora, nomearEstadoEncomenda } from "@/lib/format";
import {
  Package,
  Loader2,
  Eye,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";

interface OrderItem {
  id: string;
  quantidade: number;
  precoUnitario: number;
  product: { nome: string; slug: string };
}

interface Encomenda {
  id: string;
  status: string;
  total: number;
  metodoPagamento: string;
  createdAt: string;
  enderecoEntrega: any;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EM_SEPARACAO: "bg-purple-100 text-purple-800",
  ENVIADO: "bg-indigo-100 text-indigo-800",
  ENTREGUE: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const PAYMENT_LABELS: Record<string, string> = {
  REFERENCIA: "Multicaixa Express",
  TRANSFERENCIA: "Transferência Bancária",
  PAGAMENTO_ENTREGA: "Pagamento na Entrega",
};

export default function HistoricoEncomendasPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandida, setExpandida] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
      return;
    }

    apiRequest<Encomenda[]>("/orders", { token: accessToken })
      .then(setEncomendas)
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [accessToken]);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">As Minhas Encomendas</h1>
          <p className="text-sm text-gray-500">{encomendas.length} encomenda(s)</p>
        </div>

        {carregando ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : encomendas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-20">
            <ShoppingBag size={48} className="mb-4 text-gray-300" />
            <p className="mb-2 text-lg font-medium text-gray-500">Ainda não tem encomendas</p>
            <p className="mb-6 text-sm text-gray-400">Comece por explorar os nossos produtos</p>
            <Link href="/produtos" className="btn-primary">
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {encomendas.map((encomenda) => {
              const cor = STATUS_COLORS[encomenda.status] || "bg-gray-100 text-gray-800";
              return (
                <div
                  key={encomenda.id}
                  className="rounded-xl border border-gray-100 bg-white"
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <span className="font-mono text-xs text-gray-400">
                          #{encomenda.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`badge ${cor}`}>
                          {nomearEstadoEncomenda(encomenda.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatarDataHora(encomenda.createdAt)} — {encomenda.items.length} {encomenda.items.length === 1 ? "item" : "itens"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-primary-600">
                        {formatarKwanza(encomenda.total)}
                      </p>
                      <button
                        onClick={() =>
                          setExpandida(expandida === encomenda.id ? null : encomenda.id)
                        }
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600"
                      >
                        Detalhes
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${expandida === encomenda.id ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                  </div>

                  {expandida === encomenda.id && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-4">
                      <div className="mb-3">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Itens
                        </h4>
                        <div className="space-y-2">
                          {encomenda.items.map((item) => (
                            <Link
                              key={item.id}
                              href={`/produtos/${item.product.slug}`}
                              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100"
                            >
                              <span className="text-gray-700">
                                {item.product.nome} × {item.quantidade}
                              </span>
                              <span className="font-medium text-gray-900">
                                {formatarKwanza(item.precoUnitario * item.quantidade)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-2">
                        <span className="text-sm text-gray-600">
                          Pagamento: {PAYMENT_LABELS[encomenda.metodoPagamento] || encomenda.metodoPagamento}
                        </span>
                        <span className="font-bold text-primary-600">
                          {formatarKwanza(encomenda.total)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
