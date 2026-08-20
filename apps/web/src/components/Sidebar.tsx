"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import {
  Home,
  Package,
  ShoppingCart,
  User,
  LogOut,
  Shield,
  Grid3X3,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ClipboardList,
  Heart,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";

/**
 * Menu lateral — AE Gadget
 *
 * Navegação principal da loja com estilo comercial.
 * Suporta mobile (hamburger menu) e desktop (sidebar fixo).
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileAberto, setMobileAberto] = useState(false);
  const [categoriasAberto, setCategoriasAberto] = useState(false);

  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  function isActive(href: string) {
    return pathname === href;
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
        <img src="/img/Logo.png" alt="AE Gadget" className="h-10 w-10 rounded-xl object-contain" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">AE Gadget</h1>
          <p className="text-xs text-gray-500">Loja de Eletrónica</p>
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <Link
            href="/"
            onClick={() => setMobileAberto(false)}
            className={clsx(
              "sidebar-link",
              isActive("/") && "sidebar-link-active"
            )}
          >
            <Home size={18} />
            Início
          </Link>

          <Link
            href="/produtos"
            onClick={() => setMobileAberto(false)}
            className={clsx(
              "sidebar-link",
              isActive("/produtos") && "sidebar-link-active"
            )}
          >
            <Package size={18} />
            Produtos
          </Link>

          {/* Categorias com submenus */}
          <div>
            <button
              onClick={() => setCategoriasAberto(!categoriasAberto)}
              className="sidebar-link w-full"
            >
              <Grid3X3 size={18} />
              Categorias
              {categoriasAberto ? (
                <ChevronDown size={14} className="ml-auto" />
              ) : (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </button>
            {categoriasAberto && (
              <div className="ml-6 mt-1 space-y-1 border-l border-gray-100 pl-3">
                <Link
                  href="/produtos?categoria=smartphones"
                  onClick={() => setMobileAberto(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-primary-600"
                >
                  Smartphones
                </Link>
                <Link
                  href="/produtos?categoria=acessorios"
                  onClick={() => setMobileAberto(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-primary-600"
                >
                  Acessórios
                </Link>
                <Link
                  href="/produtos?categoria=audio"
                  onClick={() => setMobileAberto(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-primary-600"
                >
                  Áudio
                </Link>
                <Link
                  href="/produtos?categoria=computadores"
                  onClick={() => setMobileAberto(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-primary-600"
                >
                  Computadores
                </Link>
                <Link
                  href="/produtos?categoria=redes"
                  onClick={() => setMobileAberto(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-primary-600"
                >
                  Redes
                </Link>
                <Link
                  href="/produtos?categoria=casa-inteligente"
                  onClick={() => setMobileAberto(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-primary-600"
                >
                  Casa Inteligente
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/carrinho"
            onClick={() => setMobileAberto(false)}
            className={clsx(
              "sidebar-link",
              isActive("/carrinho") && "sidebar-link-active"
            )}
          >
            <ShoppingCart size={18} />
            Carrinho
          </Link>

          {isAuthenticated && (
            <Link
              href="/perfil/favoritos"
              onClick={() => setMobileAberto(false)}
              className={clsx(
                "sidebar-link",
                isActive("/perfil/favoritos") && "sidebar-link-active"
              )}
            >
              <Heart size={18} />
              Favoritos
            </Link>
          )}

          {isAuthenticated && (
            <Link
              href="/perfil/encomendas"
              onClick={() => setMobileAberto(false)}
              className={clsx(
                "sidebar-link",
                isActive("/perfil/encomendas") && "sidebar-link-active"
              )}
            >
              <ClipboardList size={18} />
              As Minhas Encomendas
            </Link>
          )}
        </div>

        {/* Separador */}
        <div className="my-4 border-t border-gray-100" />

        {/* Área Admin */}
        {isAdmin && (
          <div className="space-y-1">
            <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Administração
            </p>
            <Link
              href="/admin"
              onClick={() => setMobileAberto(false)}
              className={clsx(
                "sidebar-link",
                isActive("/admin") && "sidebar-link-active"
              )}
            >
              <Shield size={18} />
              Painel Admin
            </Link>
            <Link
              href="/admin/cupoes"
              onClick={() => setMobileAberto(false)}
              className={clsx(
                "sidebar-link",
                isActive("/admin/cupoes") && "sidebar-link-active"
              )}
            >
              <Tag size={18} />
              Cupões
            </Link>
          </div>
        )}
      </nav>

      {/* Rodapé da sidebar — Auth */}
      <div className="border-t border-gray-100 px-3 py-4">
        {isAuthenticated ? (
          <div className="space-y-2">
            <Link
              href="/perfil"
              onClick={() => setMobileAberto(false)}
              className={clsx(
                "sidebar-link",
                isActive("/perfil") && "sidebar-link-active"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                {user?.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.nome}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={() => {
                logout();
                setMobileAberto(false);
              }}
              className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              Terminar sessão
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileAberto(false)}
              className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
            >
              <User size={16} />
              Entrar
            </Link>
            <Link
              href="/registo"
              onClick={() => setMobileAberto(false)}
              className="btn-secondary flex w-full items-center justify-center text-sm"
            >
              Criar Conta
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile — Botão hamburger */}
      <button
        onClick={() => setMobileAberto(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
      >
        <Menu size={20} className="text-gray-700" />
      </button>

      {/* Mobile — Overlay + Sidebar */}
      {mobileAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileAberto(false)}
          />
          <div className="relative flex h-full w-72 flex-col bg-white shadow-xl">
            <button
              onClick={() => setMobileAberto(false)}
              className="absolute right-3 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop — Sidebar fixo */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        {navContent}
      </aside>
    </>
  );
}
