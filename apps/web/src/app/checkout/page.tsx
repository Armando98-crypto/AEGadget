"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, ApiError } from "@/lib/api";
import { formatarKwanza } from "@/lib/format";
import { useAuthStore } from "@/store/auth.store";
import { Loader2, CheckCircle } from "lucide-react";

const checkoutSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  telefone: z.string().min(9, "Telefone é obrigatório"),
  rua: z.string().min(3, "Rua é obrigatória"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  municipio: z.string().min(2, "Município é obrigatório"),
  provincia: z.string().min(2, "Província é obrigatória"),
  referencia: z.string().optional(),
  metodoPagamento: z.enum(["REFERENCIA", "TRANSFERENCIA", "PAGAMENTO_ENTREGA"]),
  notas: z.string().optional(),
  cupaoCodigo: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CartData {
  items: {
    id: string;
    quantidade: number;
    product: {
      id: string;
      nome: string;
      preco: number;
      images: { url: string }[];
    };
  }[];
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuthStore();
  const [carrinho, setCarrinho] = useState<CartData | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [cupaoCodigo, setCupaoCodigo] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [cupaoValido, setCupaoValido] = useState<{ codigo: string; tipo: string } | null>(null);
  const [validandoCupao, setValidandoCupao] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      nome: user?.nome || "",
      metodoPagamento: "PAGAMENTO_ENTREGA",
      provincia: "Huíla",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    apiRequest<CartData>("/cart", { token: accessToken! })
      .then((data) => {
        if (data.items.length === 0) {
          router.push("/carrinho");
          return;
        }
        setCarrinho(data);
      })
      .catch(() => router.push("/carrinho"))
      .finally(() => setCarregando(false));
  }, [isAuthenticated]);

  async function onSubmit(data: CheckoutFormData) {
    setErro(null);
    try {
      await apiRequest("/orders", {
        method: "POST",
        token: accessToken!,
        body: JSON.stringify({
          enderecoEntrega: {
            nome: data.nome,
            telefone: data.telefone,
            rua: data.rua,
            bairro: data.bairro,
            municipio: data.municipio,
            provincia: data.provincia,
            referencia: data.referencia,
          },
          metodoPagamento: data.metodoPagamento,
          notas: data.notas,
          cupaoCodigo: cupaoValido?.codigo,
        }),
      });
      setSucesso(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro("Erro ao criar encomenda. Tente novamente.");
      }
    }
  }

  async function validarCupao() {
    if (!cupaoCodigo.trim() || !carrinho) return;
    setValidandoCupao(true);
    try {
      const res = await apiRequest<{ valido: boolean; desconto: number; cupao: { codigo: string; tipo: string } }>(
        "/coupons/validate",
        {
          method: "POST",
          body: JSON.stringify({ codigo: cupaoCodigo, total: carrinho.total }),
        }
      );
      if (res.valido) {
        setDesconto(res.desconto);
        setCupaoValido(res.cupao);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      }
      setDesconto(0);
      setCupaoValido(null);
    } finally {
      setValidandoCupao(false);
    }
  }

  function removerCupao() {
    setCupaoCodigo("");
    setDesconto(0);
    setCupaoValido(null);
  }

  if (sucesso) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <CheckCircle size={64} className="mb-4 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Encomenda Criada!
        </h1>
        <p className="mb-6 text-gray-600">
          A sua encomenda foi registada com sucesso.
        </p>
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <p className="font-semibold">Próximos passos:</p>
          <p>Encontramos os dados de pagamento na sua conta de email.</p>
        </div>
        <Link href="/" className="btn-primary">
          Voltar à Loja
        </Link>
      </div>
    );
  }

  if (carregando || !carrinho) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulário */}
        <div className="space-y-6 lg:col-span-2">
          {/* Endereço de entrega */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Endereço de Entrega
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
                <input {...register("nome")} className="input-base" />
                {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Telefone *</label>
                <input {...register("telefone")} className="input-base" placeholder="+244..." />
                {errors.telefone && <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Rua/Avenida *</label>
                <input {...register("rua")} className="input-base" placeholder="Ex: Rua Major Kanhangulo" />
                {errors.rua && <p className="mt-1 text-xs text-red-600">{errors.rua.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bairro *</label>
                <input {...register("bairro")} className="input-base" />
                {errors.bairro && <p className="mt-1 text-xs text-red-600">{errors.bairro.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Município *</label>
                <input {...register("municipio")} className="input-base" />
                {errors.municipio && <p className="mt-1 text-xs text-red-600">{errors.municipio.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Província *</label>
                <input {...register("provincia")} className="input-base" />
                {errors.provincia && <p className="mt-1 text-xs text-red-600">{errors.provincia.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Referência</label>
                <input {...register("referencia")} className="input-base" placeholder="Ex: ao lado do pharmacy" />
              </div>
            </div>
          </div>

          {/* Método de pagamento */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Método de Pagamento
            </h2>
            <div className="space-y-3">
              {[
                { value: "PAGAMENTO_ENTREGA", label: "Pagamento na Entrega", desc: "Pague em dinheiro quando receber" },
                { value: "TRANSFERENCIA", label: "Transferência Bancária", desc: "Faça uma transferência para a nossa conta" },
                { value: "REFERENCIA", label: "Multicaixa Express", desc: "Gere uma referência de pagamento" },
              ].map((metodo) => (
                <label
                  key={metodo.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/50 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
                >
                  <input
                    type="radio"
                    value={metodo.value}
                    {...register("metodoPagamento")}
                    className="h-4 w-4 text-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{metodo.label}</p>
                    <p className="text-sm text-gray-500">{metodo.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div className="rounded-xl border border-gray-100 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Notas (opcional)
            </h2>
            <textarea
              {...register("notas")}
              className="input-base"
              rows={3}
              placeholder="Ex: Entregar depois das 18h"
            />
          </div>
        </div>

        {/* Resumo da encomenda */}
        <div>
          <div className="sticky top-20 rounded-xl border border-gray-100 bg-white p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Resumo ({carrinho.items.length} {carrinho.items.length === 1 ? "item" : "itens"})
            </h2>
            <div className="mb-4 max-h-60 space-y-3 overflow-y-auto">
              {carrinho.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {item.product.images[0] ? (
                      <img src={item.product.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 truncate text-sm">
                    <p className="truncate font-medium">{item.product.nome}</p>
                    <p className="text-gray-500">Qtd: {item.quantidade}</p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatarKwanza(Number(item.product.preco) * item.quantidade)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cupão */}
            <div className="mb-4 border-t border-gray-100 pt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Cupão de desconto</label>
              {cupaoValido ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <span className="text-sm font-medium text-green-700">{cupaoValido.codigo}</span>
                  <button onClick={removerCupao} className="text-xs text-red-500 hover:text-red-600">
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={cupaoCodigo}
                    onChange={(e) => setCupaoCodigo(e.target.value.toUpperCase())}
                    className="input-base flex-1 py-2 text-sm"
                    placeholder="Código do cupão"
                  />
                  <button
                    onClick={validarCupao}
                    disabled={validandoCupao || !cupaoCodigo.trim()}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                  >
                    {validandoCupao ? "..." : "Aplicar"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatarKwanza(carrinho.total)}</span>
              </div>
              {desconto > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Desconto</span>
                  <span className="text-green-600">-{formatarKwanza(desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Entrega</span>
                <span className="text-green-600">Grátis</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">{formatarKwanza(carrinho.total - desconto)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary mt-4 flex w-full items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> A processar...
                </>
              ) : (
                "Confirmar Encomenda"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
