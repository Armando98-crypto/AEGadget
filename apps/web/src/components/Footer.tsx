import Link from "next/link";

/**
 * Rodapé da loja — AE Gadget
 */
export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Coluna 1 — Sobre */}
          <div>
            <h3 className="mb-3 text-lg font-bold text-gray-900">
              AE Gadget
            </h3>
            <p className="text-sm text-gray-600">
              A sua loja de gadgets e eletrónica em Lubango, Angola.
              Os melhores preços em smartphones, acessórios e muito mais.
            </p>
          </div>

          {/* Coluna 2 — Links úteis */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Links Úteis
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/produtos"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  Produtos
                </Link>
              </li>
              <li>
                <Link
                  href="/carrinho"
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  Carrinho
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 — Contacto */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-900">
              Contacto
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Lubango, Angola</li>
              <li>+244 923 456 789</li>
              <li>info@aegadget.co.ao</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AE Gadget. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
