"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarKwanza } from "@/lib/format";
import { useAuthStore } from "@/store/auth.store";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Package,
} from "lucide-react";

interface CartItem {
  id: string;
  quantidade: number;
  product: {
    id: string;
    nome: string;
    slug: string;
    preco: number;
    stock: number;
    images: { url: string }[];
  };
}

interface CartData {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export default function CarrinhoPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [carrinho, setCarrinho] = useState<CartData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    carregarCarrinho();
  }, [isAuthenticated]);

  async function carregarCarrinho() {
    try {
      const data = await apiRequest<CartData>("/cart", { token: accessToken! });
      setCarrinho(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarQuantidade(itemId: string, novaQtd: number) {
    setAtualizando(itemId);
    try {
      await apiRequest(`/cart/items/${itemId}`, {
        method: "PUT",
        token: accessToken!,
        body: JSON.stringify({ quantidade: novaQtd }),
      });
      await carregarCarrinho();
    } catch (error) {
      if (error instanceof ApiError) alert(error.message);
    } finally {
      setAtualizando(null);
    }
  }

  async function removerItem(itemId: string) {
    setAtualizando(itemId);
    try {
      await apiRequest(`/cart/items/${itemId}`, {
        method: "DELETE",
        token: accessToken!,
      });
      await carregarCarrinho();
    } catch (error) {
      console.error(error);
    } finally {
      setAtualizando(null);
    }
  }

  if (carregando) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4">
            <div className="skeleton h-20 w-20 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!carrinho || carrinho.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-20">
        <ShoppingBag size={48} className="mb-4 text-gray-300" />
        <p className="mb-2 text-lg font-medium text-gray-500">O carrinho está vazio</p>
        <p className="mb-6 text-sm text-gray-400">Adicione produtos para começar</p>
        <Link href="/produtos" className="btn-primary">
          Ver Produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Carrinho ({carrinho.itemCount} {carrinho.itemCount === 1 ? "item" : "itens"})
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Itens do carrinho */}
        <div className="space-y-4 lg:col-span-2">
          {carrinho.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4"
            >
              <Link href={`/produtos/${item.product.slug}`} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.product.images[0] ? (
                  <img
                    src={item.product.images[0].url}
                    alt={item.product.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package size={24} className="text-gray-300" />
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/produtos/${item.product.slug}`}
                    className="font-medium text-gray-900 hover:text-primary-600"
                  >
                    {item.product.nome}
                  </Link>
                  <p className="text-sm text-primary-600">
                    {formatarKwanza(Number(item.product.preco))}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button
                      onClick={() =>
                        item.quantidade > 1
                          ? atualizarQuantidade(item.id, item.quantidade - 1)
                          : removerItem(item.id)
                      }
                      disabled={atualizando === item.id}
                      className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="flex h-8 w-10 items-center justify-center text-sm font-medium">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() =>
                        atualizarQuantidade(item.id, item.quantidade + 1)
                      }
                      disabled={atualizando === item.id || item.quantidade >= item.product.stock}
                      className="flex h-8 w-8 items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {formatarKwanza(Number(item.product.preco) * item.quantidade)}
                    </span>
                    <button
                      onClick={() => removerItem(item.id)}
                      disabled={atualizando === item.id}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="rounded-xl border border-gray-100 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resumo</h2>
          <div className="space-y-3 border-b border-gray-100 pb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatarKwanza(carrinho.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Entrega</span>
              <span className="text-green-600">Grátis</span>
            </div>
          </div>
          <div className="flex justify-between py-4 text-lg font-bold">
            <span>Total</span>
            <span className="text-primary-600">{formatarKwanza(carrinho.total)}</span>
          </div>
          <Link
            href="/checkout"
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            Finalizar Compra
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
