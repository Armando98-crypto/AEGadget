"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest } from "@/lib/api";
import { formatarKwanza } from "@/lib/format";
import { Heart, Package, Star, Trash2 } from "lucide-react";

interface Favorito {
  id: string;
  product: {
    id: string;
    nome: string;
    slug: string;
    preco: number;
    stock: number;
    mediaAvaliacao: number | null;
    images: { url: string }[];
    category: { nome: string } | null;
    vendor: { nome: string };
    _count: { reviews: number };
  };
}

export default function FavoritosPage() {
  const { accessToken } = useAuthStore();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [removendo, setRemovendo] = useState<string | null>(null);

  useEffect(() => {
    carregarFavoritos();
  }, []);

  async function carregarFavoritos() {
    try {
      const data = await apiRequest<Favorito[]>("/wishlist", { token: accessToken! });
      setFavoritos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  async function removerFavorito(productId: string) {
    setRemovendo(productId);
    try {
      await apiRequest(`/wishlist/${productId}`, {
        method: "POST",
        token: accessToken!,
      });
      setFavoritos((prev) => prev.filter((f) => f.product.id !== productId));
    } catch (error) {
      console.error(error);
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Os Meus Favoritos</h1>
          <p className="text-sm text-gray-500">
            {favoritos.length} {favoritos.length === 1 ? "produto" : "produtos"} guardado(s)
          </p>
        </div>

        {carregando ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-product">
                <div className="skeleton h-48 w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-6 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : favoritos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-20">
            <Heart size={48} className="mb-4 text-gray-300" />
            <p className="mb-2 text-lg font-medium text-gray-500">Nenhum favorito</p>
            <p className="mb-6 text-sm text-gray-400">
              Adicione produtos aos favoritos para os encontrar facilmente
            </p>
            <Link href="/produtos" className="btn-primary">
              Ver Produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {favoritos.map((fav) => (
              <div key={fav.id} className="card-product group">
                <div className="relative h-48 bg-gray-100">
                  <Link href={`/produtos/${fav.product.slug}`}>
                    {fav.product.images[0] ? (
                      <img
                        src={fav.product.images[0].url}
                        alt={fav.product.nome}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package size={40} className="text-gray-300" />
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={() => removerFavorito(fav.product.id)}
                    disabled={removendo === fav.product.id}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 shadow-md transition-all hover:bg-red-50"
                    title="Remover dos favoritos"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="p-4">
                  {fav.product.category && (
                    <p className="mb-1 text-xs text-primary-500">{fav.product.category.nome}</p>
                  )}
                  <Link href={`/produtos/${fav.product.slug}`}>
                    <h3 className="mb-2 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary-600">
                      {fav.product.nome}
                    </h3>
                  </Link>
                  {fav.product.mediaAvaliacao && (
                    <div className="mb-2 flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">
                        {fav.product.mediaAvaliacao.toFixed(1)} ({fav.product._count.reviews})
                      </span>
                    </div>
                  )}
                  <p className="text-lg font-bold text-primary-600">
                    {formatarKwanza(Number(fav.product.preco))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
