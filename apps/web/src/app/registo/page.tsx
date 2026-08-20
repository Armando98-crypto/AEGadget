"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { authApi, ApiError } from "@/lib/api";
import { Eye, EyeOff, Loader2, Store } from "lucide-react";

const registarSchema = z
  .object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    telefone: z
      .string()
      .regex(/^\+?244[9][1-9]\d{7}$/, "Formato: +244XXXXXXXXX")
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });

type RegistarFormData = z.infer<typeof registarSchema>;

export default function RegistoPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistarFormData>({
    resolver: zodResolver(registarSchema),
  });

  async function onSubmit(data: RegistarFormData) {
    setErro(null);
    try {
      const resultado = await authApi.registar({
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || undefined,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      setAuth(resultado.data.utilizador as any, resultado.data.accessToken, resultado.data.refreshToken);
      setSucesso(true);
      setTimeout(() => router.push("/"), 1000);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro("Erro ao criar conta. Tente novamente.");
      }
    }
  }

  if (sucesso) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-500">
            ✓
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Conta criada!</h1>
          <p className="text-gray-500">A redirecionar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-white">
            <Store size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-sm text-gray-500">
            Junte-se à AE Gadget
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {erro && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="nome" className="mb-1 block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input id="nome" type="text" className="input-base" placeholder="João da Silva" {...register("nome")} />
              {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input id="email" type="email" className="input-base" placeholder="exemplo@email.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="telefone" className="mb-1 block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input id="telefone" type="tel" className="input-base" placeholder="+244923456789" {...register("telefone")} />
              {errors.telefone && <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  className="input-base pr-10"
                  placeholder="Mínimo 6 caracteres"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
                Confirmar palavra-passe
              </label>
              <input
                id="confirmPassword"
                type={mostrarPassword ? "text" : "password"}
                className="input-base"
                placeholder="Repita a palavra-passe"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> A criar conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-primary-500 hover:text-primary-600">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
