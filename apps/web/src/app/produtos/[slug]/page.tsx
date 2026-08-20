"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarKwanza } from "@/lib/format";
import { useAuthStore } from "@/store/auth.store";
import ReviewForm from "@/components/ReviewForm";
import {
  ShoppingCart,
  Star,
  Package,
  Minus,
  Plus,
  Truck,
  Shield,
  Store,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Heart,
} from "lucide-react";

interface ProdutoDetalhe {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  preco: number;
  stock: number;
  estado: string;
  mediaAvaliacao: number | null;
  images: { id: string; url: string; ordem: number }[];
  category: { id: string; nome: string; slug: string } | null;
  vendor: { id: string; nome: string; logoUrl: string | null };
  reviews: {
    id: string;
    rating: number;
    comentario: string | null;
    createdAt: string;
    user: { id: string; nome: string };
  }[];
  _count: { reviews: number };
}

export default function ProdutoDetalhePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { accessToken } = useAuthStore();

  const [produto, setProduto] = useState<ProdutoDetalhe | null>(null);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionando, setAdicionando] = useState(false);
  const [favoritado, setFavoritado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setCarregando(true);
    apiRequest<ProdutoDetalhe>(`/products/${slug}`)
      .then((data) => {
        setProduto(data);
        // Verificar se está nos favoritos
        if (accessToken) {
          apiRequest<{ favoritado: boolean }>(`/wishlist/check/${data.id}`, { token: accessToken })
            .then((res) => setFavoritado(res.favoritado))
            .catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [slug, accessToken]);

  async function toggleFavorito() {
    if (!accessToken || !produto) {
      setMensagem({ tipo: "erro", texto: "Faça login para favoritar" });
      return;
    }
    try {
      const res = await apiRequest<{ favoritado: boolean }>(`/wishlist/${produto.id}`, {
        method: "POST",
        token: accessToken,
      });
      setFavoritado(res.favoritado);
    } catch (error) {
      console.error(error);
    }
  }

  async function adicionarAoCarrinho() {
    if (!accessToken) {
      setMensagem({ tipo: "erro", texto: "Faça login para adicionar ao carrinho" });
      return;
    }
    setAdicionando(true);
    setMensagem(null);
    try {
      await apiRequest("/cart/items", {
        method: "POST",
        token: accessToken,
        body: JSON.stringify({ productId: produto!.id, quantidade }),
      });
      setMensagem({ tipo: "ok", texto: "Adicionado ao carrinho!" });
    } catch (error) {
      if (error instanceof ApiError) {
        setMensagem({ tipo: "erro", texto: error.message });
      } else {
        setMensagem({ tipo: "erro", texto: "Erro ao adicionar ao carrinho" });
      }
    } finally {
      setAdicionando(false);
    }
  }

  function imagemAnterior() {
    if (!produto) return;
    setImagemAtiva((prev) => (prev === 0 ? produto.images.length - 1 : prev - 1));
  }

  function proximaImagem() {
    if (!produto) return;
    setImagemAtiva((prev) => (prev === produto.images.length - 1 ? 0 : prev + 1));
  }

  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="skeleton h-96 rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-6 w-1/3 rounded" />
            <div className="skeleton h-12 w-1/2 rounded" />
            <div className="skeleton h-32 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Package size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Produto não encontrado</p>
        <Link href="/produtos" className="mt-4 text-sm text-primary-500 hover:text-primary-600">
          ← Voltar aos produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/produtos" className="hover:text-primary-500">Produtos</Link>
        <span>/</span>
        {produto.category && (
          <>
            <Link href={`/produtos?categoria=${produto.category.slug}`} className="hover:text-primary-500">
              {produto.category.nome}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-900">{produto.nome}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Galeria de Imagens */}
        <div>
          {/* Imagem Principal */}
          <div className="relative mb-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-100">
            {produto.images.length > 0 ? (
              <>
                <img
                  src={produto.images[imagemAtiva]?.url}
                  alt={produto.nome}
                  className="h-[400px] w-full object-contain"
                />
                {/* Setas */}
                {produto.images.length > 1 && (
                  <>
                    <button
                      onClick={imagemAnterior}
                      className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={proximaImagem}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-all hover:bg-black/50"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
                {/* Contador */}
                <div className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
                  {imagemAtiva + 1} / {produto.images.length}
                </div>
              </>
            ) : (
              <div className="flex h-[400px] items-center justify-center">
                <Package size={64} className="text-gray-300" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {produto.images.length > 1 && (
            <div className="flex gap-2">
              {produto.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setImagemAtiva(i)}
                  className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                    i === imagemAtiva
                      ? "border-primary-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${produto.nome} ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute left-0.5 top-0.5 rounded bg-primary-500 px-1 py-0.5 text-[8px] font-bold text-white">
                      PRINCIPAL
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Indicador de imagens */}
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <ImageIcon size={12} />
            {produto.images.length} {produto.images.length === 1 ? "imagem" : "imagens"}
          </div>
        </div>

        {/* Detalhes */}
        <div>
          {produto.category && (
            <p className="mb-2 text-sm font-medium text-primary-500">{produto.category.nome}</p>
          )}
          <h1 className="mb-2 text-2xl font-bold text-gray-900">{produto.nome}</h1>

          {/* Avaliação */}
          {produto.mediaAvaliacao && (
            <div className="mb-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.round(produto.mediaAvaliacao!)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {produto.mediaAvaliacao.toFixed(1)} ({produto._count.reviews} avaliações)
              </span>
            </div>
          )}

          {/* Preço */}
          <div className="mb-6 rounded-xl bg-primary-50 p-4">
            <p className="text-3xl font-bold text-primary-600">
              {formatarKwanza(Number(produto.preco))}
            </p>
          </div>

          {/* Stock */}
          <div className="mb-6">
            {produto.stock > 0 ? (
              <p className="text-sm text-green-600">
                ✓ Em stock ({produto.stock} unidades disponíveis)
              </p>
            ) : (
              <p className="text-sm text-red-600">✗ Esgotado</p>
            )}
          </div>

          {/* Quantidade + Adicionar ao carrinho */}
          {produto.stock > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-gray-200">
                <button
                  onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                  className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  <Minus size={16} />
                </button>
                <span className="flex h-10 w-12 items-center justify-center font-medium">
                  {quantidade}
                </span>
                <button
                  onClick={() => setQuantidade(Math.min(produto.stock, quantidade + 1))}
                  className="flex h-10 w-10 items-center justify-center text-gray-600 hover:bg-gray-50"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={adicionarAoCarrinho}
                disabled={adicionando}
                className="btn-primary flex flex-1 items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                {adicionando ? "A adicionar..." : "Adicionar ao Carrinho"}
              </button>
              <button
                onClick={toggleFavorito}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-all ${
                  favoritado
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-500"
                }`}
                title={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart size={20} className={favoritado ? "fill-current" : ""} />
              </button>
            </div>
          )}

          {/* Mensagem */}
          {mensagem && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                mensagem.tipo === "ok"
                  ? "border border-green-200 bg-green-50 text-green-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {mensagem.texto}
            </div>
          )}

          {/* Benefícios */}
          <div className="space-y-3 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck size={18} className="text-primary-500" />
              Entrega em Lubango
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield size={18} className="text-primary-500" />
              Produto garantido
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Store size={18} className="text-primary-500" />
              Vendido por {produto.vendor.nome}
            </div>
          </div>

          {/* Descrição */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="mb-3 font-semibold text-gray-900">Descrição</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {produto.descricao}
            </p>
          </div>
        </div>
      </div>

      {/* Avaliações */}
      <div className="mt-8 border-t border-gray-100 pt-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">
          Avaliações ({produto._count.reviews})
        </h2>

        {/* Formulário de avaliação */}
        <div className="mb-6">
          <ReviewForm
            productId={produto.id}
            onReviewCreated={() => {
              // Recarregar produto para atualizar avaliações
              apiRequest<ProdutoDetalhe>(`/products/${slug}`).then(setProduto);
            }}
          />
        </div>

        {/* Lista de avaliações */}
        {produto.reviews.length > 0 && (
          <div className="space-y-4">
            {produto.reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                    {review.user.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{review.user.nome}</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>
                {review.comentario && (
                  <p className="text-sm text-gray-600">{review.comentario}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
