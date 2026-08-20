"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { ShoppingCart, User, LogOut, Menu, X, Shield } from "lucide-react";
import { useState } from "react";

/**
 * Cabeçalho da loja — AE Gadget
 *
 * Mostra:
 * - Logo e nome da loja
 * - Links de navegação
 * - Estado de autenticação (login/registo ou perfil/logout)
 * - Carrinho de compras
 */
export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-600">
            AE Gadget
          </span>
        </Link>

        {/* Navegação Desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/produtos"
            className="text-sm font-medium text-gray-600 hover:text-primary-600"
          >
            Produtos
          </Link>

          {isAuthenticated && user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary-600"
            >
              <Shield size={14} />
              Admin
            </Link>
          )}
        </nav>

        {/* Ações da direita */}
        <div className="flex items-center gap-4">
          {/* Carrinho */}
          <Link
            href="/carrinho"
            className="relative text-gray-600 hover:text-primary-600"
          >
            <ShoppingCart size={22} />
          </Link>

          {/* Auth — Desktop */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/perfil"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600"
                >
                  <User size={16} />
                  {user?.nome?.split(" ")[0]}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-primary-600"
                >
                  Entrar
                </Link>
                <Link href="/registo" className="btn-primary !px-4 !py-2 text-sm">
                  Criar Conta
                </Link>
              </div>
            )}
          </div>

          {/* Menu Mobile Toggle */}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="text-gray-600 md:hidden"
          >
            {menuAberto ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuAberto && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href="/produtos"
              onClick={() => setMenuAberto(false)}
              className="text-sm font-medium text-gray-600 hover:text-primary-600"
            >
              Produtos
            </Link>

            {isAuthenticated && user?.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMenuAberto(false)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary-600"
              >
                <Shield size={14} />
                Admin
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  href="/perfil"
                  onClick={() => setMenuAberto(false)}
                  className="text-sm text-gray-700 hover:text-primary-600"
                >
                  O meu perfil
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuAberto(false);
                  }}
                  className="text-left text-sm text-red-600 hover:text-red-700"
                >
                  Terminar sessão
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuAberto(false)}
                  className="text-sm font-medium text-gray-600 hover:text-primary-600"
                >
                  Entrar
                </Link>
                <Link
                  href="/registo"
                  onClick={() => setMenuAberto(false)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
