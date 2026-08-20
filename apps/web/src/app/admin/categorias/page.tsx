"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest, ApiError } from "@/lib/api";
import {
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Package,
} from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  _count: { products: number };
  subcategorias: { id: string; nome: string; slug: string }[];
}

export default function AdminCategoriasPage() {
  const { accessToken } = useAuthStore();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [formNome, setFormNome] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    setCarregando(true);
    try {
      const data = await apiRequest<Categoria[]>("/categories", { token: accessToken! });
      setCategorias(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  function abrirNova() {
    setEditando(null);
    setFormNome("");
    setFormDescricao("");
    setErro(null);
    setModalAberto(true);
  }

  function abrirEditar(cat: Categoria) {
    setEditando(cat);
    setFormNome(cat.nome);
    setFormDescricao(cat.descricao || "");
    setErro(null);
    setModalAberto(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErro(null);

    try {
      if (editando) {
        await apiRequest(`/categories/${editando.id}`, {
          method: "PUT",
          token: accessToken!,
          body: JSON.stringify({ nome: formNome, descricao: formDescricao || null }),
        });
      } else {
        await apiRequest("/categories", {
          method: "POST",
          token: accessToken!,
          body: JSON.stringify({ nome: formNome, descricao: formDescricao || null }),
        });
      }
      await carregarCategorias();
      setModalAberto(false);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro("Erro ao guardar categoria");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string, nome: string) {
    if (!confirm(`Eliminar a categoria "${nome}"?`)) return;
    try {
      await apiRequest(`/categories/${id}`, { method: "DELETE", token: accessToken! });
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      if (error instanceof ApiError) alert(error.message);
    }
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
            <p className="text-sm text-gray-500">{categorias.length} categorias</p>
          </div>
          <button onClick={abrirNova} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nova Categoria
          </button>
        </div>

        {carregando ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border border-gray-100 bg-white p-5 transition-all hover:shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-500">
                    <LayoutGrid size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(cat)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => eliminar(cat.id, cat.nome)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="mb-1 font-semibold text-gray-900">{cat.nome}</h3>
                {cat.descricao && (
                  <p className="mb-2 text-sm text-gray-500">{cat.descricao}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Package size={12} />
                    {cat._count.products} {cat._count.products === 1 ? "produto" : "produtos"}
                  </span>
                  {cat.subcategorias.length > 0 && (
                    <span>{cat.subcategorias.length} subcategorias</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {editando ? "Editar Categoria" : "Nova Categoria"}
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
                  <input
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="input-base"
                    placeholder="Ex: Smartphones"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
                  <textarea
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    className="input-base"
                    rows={3}
                    placeholder="Descrição opcional da categoria"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalAberto(false)} className="btn-secondary text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2 text-sm">
                    {guardando && <Loader2 size={16} className="animate-spin" />}
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
