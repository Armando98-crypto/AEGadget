import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AE Gadget — Loja de Gadgets e Eletrónica em Angola",
  description:
    "Encontre os melhores gadgets e acessórios de eletrónica em Lubango, Angola. Entrega rápida e pagamento seguro.",
  keywords: ["gadgets", "eletrónica", "Angola", "Lubango", "loja online"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className="min-h-screen bg-white antialiased">
        <Sidebar />
        <div className="pl-0 lg:pl-64">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between px-6">
              <div className="pl-12 lg:pl-0">
                <p className="text-sm text-gray-500">
                  Lubango, Angola
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">
                  +244 923 456 789
                </span>
              </div>
            </div>
          </header>

          {/* Conteúdo principal */}
          <main className="min-h-[calc(100vh-3.5rem)] bg-gray-50/50 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
