"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ImageUploader from "@/components/ImageUploader";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarKwanza } from "@/lib/format";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  Loader2,
  X,
  ImageIcon,
} from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  slug: string;
  preco: number;
  stock: number;
  estado: string;
  images: { id?: string; url: string; ordem: number }[];
  category: { id: string; nome: string } | null;
}

interface Categoria {
  id: string;
  nome: string;
}

export default function AdminProdutosPage() {
  const { accessToken } = useAuthStore();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [pesquisa, setPesquisa] = useState("");

  // Form state
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formPreco, setFormPreco] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formImagens, setFormImagens] = useState<{ url: string; ordem: number }[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<{ data: Produto[]; total: number }>("/products?limit=50&estado=ATIVO", { token: accessToken! }),
      apiRequest<Categoria[]>("/categories"),
    ])
      .then(([prods, cats]) => {
        setProdutos(prods.data || []);
        setCategorias(cats);
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, []);

  function abrirNovo() {
    setProdutoEditando(null);
    setFormNome("");
    setFormDescricao("");
    setFormPreco("");
    setFormStock("");
    setFormCategoryId("");
    setFormImagens([]);
    setErro(null);
    setModalAberto(true);
  }

  function abrirEditar(produto: Produto) {
    setProdutoEditando(produto);
    setFormNome(produto.nome);
    setFormDescricao("");
    setFormPreco(String(produto.preco));
    setFormStock(String(produto.stock));
    setFormCategoryId(produto.category?.id || "");
    // Preencher imagens existentes
    setFormImagens(produto.images.map((img) => ({ url: img.url, ordem: img.ordem })));
    setErro(null);
    setModalAberto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErro(null);

    // Validar imagens
    if (formImagens.length < 2) {
      setErro("Adicione no mínimo 2 imagens para o produto");
      setGuardando(false);
      return;
    }

    const dados = {
      nome: formNome,
      descricao: formDescricao || "Sem descrição",
      preco: parseFloat(formPreco),
      stock: parseInt(formStock),
      categoryId: formCategoryId || null,
      imagens: formImagens.map((img, i) => ({ url: img.url, ordem: i })),
    };

    try {
      if (produtoEditando) {
        await apiRequest(`/products/${produtoEditando.id}`, {
          method: "PUT",
          token: accessToken!,
          body: JSON.stringify(dados),
        });
      } else {
        await apiRequest("/products", {
          method: "POST",
          token: accessToken!,
          body: JSON.stringify(dados),
        });
      }
      const res = await apiRequest<{ data: Produto[]; total: number }>("/products?limit=50&estado=ATIVO", { token: accessToken! });
      setProdutos(res.data || []);
      setModalAberto(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro("Erro ao guardar produto");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("Tem certeza que quer eliminar este produto?")) return;
    try {
      await apiRequest(`/products/${id}`, { method: "DELETE", token: accessToken! });
      setProdutos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error(error);
    }
  }

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
            <p className="text-sm text-gray-500">{produtos.length} produto(s)</p>
          </div>
          <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Produto
          </button>
        </div>

        {/* Pesquisa */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar produtos..."
            className="input-base pl-10"
          />
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Produto</th>
                <th className="hidden px-4 py-3 font-medium text-gray-600 sm:table-cell">Categoria</th>
                <th className="px-4 py-3 font-medium text-gray-600">Preço</th>
                <th className="hidden px-4 py-3 font-medium text-gray-600 sm:table-cell">Stock</th>
                <th className="hidden px-4 py-3 font-medium text-gray-600 md:table-cell">Imagens</th>
                <th className="hidden px-4 py-3 font-medium text-gray-600 sm:table-cell">Estado</th>
                <th className="px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carregando ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    <Loader2 size={24} className="mx-auto animate-spin" />
                  </td>
                </tr>
              ) : produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                          {produto.images[0] ? (
                            <img src={produto.images[0].url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package size={16} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{produto.nome}</span>
                        <span className="block text-sm font-medium text-primary-600 sm:hidden">
                          {formatarKwanza(Number(produto.preco))}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {produto.category?.nome || "—"}
                    </td>
                    <td className="hidden px-4 py-3 font-medium text-primary-600 sm:table-cell">
                      {formatarKwanza(Number(produto.preco))}
                    </td>
                    <td className="hidden px-4 py-3">
                      <span className={produto.stock <= 5 ? "font-medium text-red-600" : "text-gray-600"}>
                        {produto.stock}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="badge bg-gray-100 text-gray-600">
                        <ImageIcon size={12} className="mr-1" />
                        {produto.images.length}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={produto.estado === "ATIVO" ? "badge-success" : "badge-danger"}>
                        {produto.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirEditar(produto)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => eliminar(produto.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {produtoEditando ? "Editar Produto" : "Novo Produto"}
                </h2>
                <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {erro && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {erro}
                </div>
              )}

              <form onSubmit={guardar} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
                  <input value={formNome} onChange={(e) => setFormNome(e.target.value)} className="input-base" required />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} className="input-base" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Preço (AOA) *</label>
                    <input type="number" value={formPreco} onChange={(e) => setFormPreco(e.target.value)} className="input-base" required min="0" step="0.01" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Stock *</label>
                    <input type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="input-base" required min="0" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
                  <select value={formCategoryId} onChange={(e) => setFormCategoryId(e.target.value)} className="input-base">
                    <option value="">Sem categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Múltiplas Imagens */}
                <ImageUploader
                  imagensExistentes={formImagens}
                  onImagensChange={setFormImagens}
                  maxImagens={6}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalAberto(false)} className="btn-secondary text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2 text-sm">
                    {guardando ? <Loader2 size={16} className="animate-spin" /> : null}
                    {guardando ? "A guardar..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
