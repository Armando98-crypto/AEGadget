"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { formatarKwanza } from "@/lib/format";
import { Search, Filter, Star, Package, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Suspense } from "react";

interface Produto {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  stock: number;
  estado: string;
  mediaAvaliacao: number | null;
  images: { id: string; url: string; ordem: number }[];
  category: { id: string; nome: string; slug: string } | null;
  _count: { reviews: number };
}

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  _count: { products: number };
}

interface ApiResponse {
  data: Produto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function ProdutosContent() {
  const searchParams = useSearchParams();
  const categoriaInicial = searchParams.get("categoria") || "";

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState(categoriaInicial);
  const [carregando, setCarregando] = useState(true);

  // Buscar categorias
  useEffect(() => {
    apiRequest<Categoria[]>("/categories").then(setCategorias).catch(console.error);
  }, []);

  // Buscar produtos
  useEffect(() => {
    setCarregando(true);
    const params = new URLSearchParams();
    params.set("page", String(pagina));
    params.set("limit", "12");
    if (pesquisa) params.set("search", pesquisa);
    if (categoria) params.set("categoryId", categoria);

    apiRequest<ApiResponse>(`/products?${params.toString()}`)
      .then((res) => {
        setProdutos(res.data);
        setTotal(res.total);
        setTotalPaginas(res.totalPages);
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [pagina, pesquisa, categoria]);

  function handlePesquisa(e: React.FormEvent) {
    e.preventDefault();
    setPagina(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <p className="text-sm text-gray-500">{total} produto(s) encontrado(s)</p>
      </div>

      {/* Barra de pesquisa e filtros */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handlePesquisa} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => { setPesquisa(e.target.value); setPagina(1); }}
              placeholder="Pesquisar produtos..."
              className="input-base pl-10"
            />
          </div>
        </form>
        <select
          value={categoria}
          onChange={(e) => { setCategoria(e.target.value); setPagina(1); }}
          className="input-base w-full sm:w-48"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de produtos */}
      {carregando ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-product">
              <div className="skeleton h-48 w-full" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-6 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : produtos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-16">
          <Package size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Nenhum produto encontrado</p>
          <p className="text-sm text-gray-400">Tente pesquisar com outros termos</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {produtos.map((produto) => (
            <Link
              key={produto.id}
              href={`/produtos/${produto.slug}`}
              className="card-product group"
            >
              <div className="relative h-48 bg-gray-100">
                {produto.images[0] ? (
                  <img
                    src={produto.images[0].url}
                    alt={produto.nome}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package size={40} className="text-gray-300" />
                  </div>
                )}
                {produto.images.length > 1 && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
                    <Images size={12} />
                    {produto.images.length}
                  </span>
                )}
                {produto.stock <= 5 && produto.stock > 0 && (
                  <span className="absolute left-2 top-2 badge-warning">
                    Últimas {produto.stock} unidades
                  </span>
                )}
                {produto.stock === 0 && (
                  <span className="absolute left-2 top-2 badge-danger">Esgotado</span>
                )}
              </div>
              <div className="p-4">
                {produto.category && (
                  <p className="mb-1 text-xs text-primary-500">{produto.category.nome}</p>
                )}
                <h3 className="mb-2 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-primary-600">
                  {produto.nome}
                </h3>
                {produto.mediaAvaliacao && (
                  <div className="mb-2 flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600">
                      {produto.mediaAvaliacao.toFixed(1)} ({produto._count.reviews})
                    </span>
                  </div>
                )}
                <p className="text-lg font-bold text-primary-600">
                  {formatarKwanza(Number(produto.preco))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagina(Math.max(1, pagina - 1))}
            disabled={pagina === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-4 text-sm text-gray-600">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
            disabled={pagina === totalPaginas}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-gray-400">A carregar...</div>}>
      <ProdutosContent />
    </Suspense>
  );
}
