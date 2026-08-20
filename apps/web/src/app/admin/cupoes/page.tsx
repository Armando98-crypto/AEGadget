"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth.store";
import { apiRequest, ApiError } from "@/lib/api";
import { Plus, Trash2, Tag, Loader2, X, Percent, DollarSign, Truck } from "lucide-react";

interface Coupon {
  id: string;
  codigo: string;
  descricao: string | null;
  tipo: string;
  valor: number;
  valorMinimo: number | null;
  usoMaximo: number | null;
  usoAtual: number;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
  createdAt: string;
}

export default function AdminCupoesPage() {
  const { accessToken } = useAuthStore();
  const [cupoes, setCupoes] = useState<Coupon[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Form state
  const [formCodigo, setFormCodigo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formTipo, setFormTipo] = useState<string>("PERCENTAGEM");
  const [formValor, setFormValor] = useState("");
  const [formValorMinimo, setFormValorMinimo] = useState("");
  const [formUsoMaximo, setFormUsoMaximo] = useState("");
  const [formDataFim, setFormDataFim] = useState("");

  useEffect(() => {
    carregarCupoes();
  }, []);

  async function carregarCupoes() {
    try {
      const data = await apiRequest<Coupon[]>("/coupons", { token: accessToken! });
      setCupoes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErro(null);

    try {
      await apiRequest("/coupons", {
        method: "POST",
        token: accessToken!,
        body: JSON.stringify({
          codigo: formCodigo,
          descricao: formDescricao || undefined,
          tipo: formTipo,
          valor: parseFloat(formValor),
          valorMinimo: formValorMinimo ? parseFloat(formValorMinimo) : undefined,
          usoMaximo: formUsoMaximo ? parseInt(formUsoMaximo) : undefined,
          dataFim: formDataFim || undefined,
        }),
      });
      await carregarCupoes();
      setModalAberto(false);
      limparForm();
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro("Erro ao guardar cupão");
      }
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("Tem certeza que quer eliminar este cupão?")) return;
    try {
      await apiRequest(`/coupons/${id}`, { method: "DELETE", token: accessToken! });
      setCupoes((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    try {
      await apiRequest(`/coupons/${id}`, {
        method: "PUT",
        token: accessToken!,
        body: JSON.stringify({ ativo: !ativo }),
      });
      setCupoes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c))
      );
    } catch (error) {
      console.error(error);
    }
  }

  function limparForm() {
    setFormCodigo("");
    setFormDescricao("");
    setFormTipo("PERCENTAGEM");
    setFormValor("");
    setFormValorMinimo("");
    setFormUsoMaximo("");
    setFormDataFim("");
  }

  function abrirNovo() {
    limparForm();
    setErro(null);
    setModalAberto(true);
  }

  function getIconeTipo(tipo: string) {
    switch (tipo) {
      case "PERCENTAGEM": return <Percent size={14} />;
      case "VALOR_FIXO": return <DollarSign size={14} />;
      case "FRETE_GRATIS": return <Truck size={14} />;
      default: return <Tag size={14} />;
    }
  }

  function getLabelTipo(tipo: string) {
    switch (tipo) {
      case "PERCENTAGEM": return "Percentagem";
      case "VALOR_FIXO": return "Valor Fixo";
      case "FRETE_GRATIS": return "Frete Grátis";
      default: return tipo;
    }
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cupões</h1>
            <p className="text-sm text-gray-500">{cupoes.length} cupão(ões)</p>
          </div>
          <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Cupão
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : cupoes.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white py-12 text-center">
              <Tag size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum cupão criado</p>
            </div>
          ) : (
            cupoes.map((cupao) => (
              <div
                key={cupao.id}
                className={`flex items-center gap-4 rounded-xl border bg-white p-4 transition-colors ${
                  cupao.ativo ? "border-gray-100" : "border-gray-100 opacity-60"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  cupao.ativo ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {getIconeTipo(cupao.tipo)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{cupao.codigo}</span>
                    <span className="badge bg-gray-100 text-gray-600">{getLabelTipo(cupao.tipo)}</span>
                    {!cupao.ativo && <span className="badge-danger">Inativo</span>}
                  </div>
                  {cupao.descricao && (
                    <p className="text-sm text-gray-500">{cupao.descricao}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {cupao.tipo === "PERCENTAGEM" && `${cupao.valor}% de desconto`}
                    {cupao.tipo === "VALOR_FIXO" && `${cupao.valor.toLocaleString("pt-AO")} Kz de desconto`}
                    {cupao.tipo === "FRETE_GRATIS" && "Entrega gratuita"}
                    {cupao.valorMinimo && ` • Compra mínima: ${cupao.valorMinimo.toLocaleString("pt-AO")} Kz`}
                    {cupao.usoMaximo && ` • Usos: ${cupao.usoAtual}/${cupao.usoMaximo}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAtivo(cupao.id, cupao.ativo)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      cupao.ativo
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cupao.ativo ? "Ativo" : "Inativo"}
                  </button>
                  <button
                    onClick={() => eliminar(cupao.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Novo Cupão</h2>
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Código *</label>
                  <input
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                    className="input-base"
                    placeholder="Ex: DESCONTO10"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
                  <input
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    className="input-base"
                    placeholder="Ex: 10% de desconto"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tipo *</label>
                  <select value={formTipo} onChange={(e) => setFormTipo(e.target.value)} className="input-base">
                    <option value="PERCENTAGEM">Percentagem (%)</option>
                    <option value="VALOR_FIXO">Valor Fixo (Kz)</option>
                    <option value="FRETE_GRATIS">Frete Grátis</option>
                  </select>
                </div>
                {formTipo !== "FRETE_GRATIS" && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Valor {formTipo === "PERCENTAGEM" ? "(%)" : "(Kz)"} *
                    </label>
                    <input
                      type="number"
                      value={formValor}
                      onChange={(e) => setFormValor(e.target.value)}
                      className="input-base"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Compra mínima (Kz)</label>
                    <input
                      type="number"
                      value={formValorMinimo}
                      onChange={(e) => setFormValorMinimo(e.target.value)}
                      className="input-base"
                      min="0"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Usos máximos</label>
                    <input
                      type="number"
                      value={formUsoMaximo}
                      onChange={(e) => setFormUsoMaximo(e.target.value)}
                      className="input-base"
                      min="1"
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Data de expiração</label>
                  <input
                    type="date"
                    value={formDataFim}
                    onChange={(e) => setFormDataFim(e.target.value)}
                    className="input-base"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalAberto(false)} className="btn-secondary text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2 text-sm">
                    {guardando && <Loader2 size={16} className="animate-spin" />}
                    {guardando ? "A guardar..." : "Criar Cupão"}
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
