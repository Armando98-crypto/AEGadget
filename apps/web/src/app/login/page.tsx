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

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setErro(null);
    try {
      const resultado = await authApi.login({
        email: data.email,
        password: data.password,
      });
      setAuth(resultado.data.utilizador as any, resultado.data.accessToken, resultado.data.refreshToken);
      const role = (resultado.data.utilizador as any).role;
      router.push(role === "ADMIN" ? "/admin" : "/");
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro("Erro ao efetuar login. Tente novamente.");
      }
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-white">
            <Store size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Entrar</h1>
          <p className="text-sm text-gray-500">
            Acesse a sua conta AE Gadget
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
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input-base"
                placeholder="exemplo@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
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
                  placeholder="A sua palavra-passe"
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> A entrar...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Ainda não tem conta?{" "}
            <Link href="/registo" className="font-medium text-primary-500 hover:text-primary-600">
              Criar conta
            </Link>
          </p>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <p className="mb-1 font-semibold">Credenciais de teste:</p>
            <p>Admin: admin@aegadget.co.ao / admin123</p>
            <p>Cliente: cliente@teste.com / cliente123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
