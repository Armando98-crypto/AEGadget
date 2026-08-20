import Link from "next/link";
import Carrossel from "@/components/Carrossel";
import { Truck, CreditCard, Shield, Package } from "lucide-react";

const slides = [
  {
    imagem: "/img/equ1.jpg",
    titulo: "Os Melhores Gadgets",
    descricao: "Encontre smartphones, acessórios e eletrónica com os melhores preços em Lubango.",
    link: "/produtos",
  },
  {
    imagem: "/img/equ3.jpg",
    titulo: "Tecnologia para Todos",
    descricao: "Smartphones, computadores e muito mais. Entrega rápida em todo o Lubango.",
    link: "/produtos",
  },
  {
    imagem: "/img/equ5.jpg",
    titulo: "Ofertas Especiais",
    descricao: "Aproveite os nossos preços imbatíveis em produtos selecionados.",
    link: "/produtos",
  },
  {
    imagem: "/img/rede.jpg",
    titulo: "Soluções de Rede",
    descricao: "Roteadores, switches e equipamento de rede para casa e escritório.",
    link: "/produtos?categoria=redes",
  },
  {
    imagem: "/img/hp.jpg",
    titulo: "Computadores HP",
    descricao: "Laptops e desktops HP para trabalho e entretenimento.",
    link: "/produtos?categoria=computadores",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Carrossel */}
      <Carrossel slides={slides} autoplayMs={5000} />

      {/* Features */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Truck, title: "Entrega Rápida", desc: "Em todo o Lubango" },
          { icon: CreditCard, title: "Pagamento Flexível", desc: "Multicaixa, transferência ou na entrega" },
          { icon: Shield, title: "Compra Segura", desc: "Produtos garantidos" },
          { icon: Package, title: "Qualidade", desc: "Os melhores gadgets" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-500">
              <item.icon size={22} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categorias */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Categorias Populares</h2>
          <Link href="/produtos" className="text-sm font-medium text-primary-500 hover:text-primary-600">
            Ver todas
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { nome: "Smartphones", slug: "smartphones", icon: "📱" },
            { nome: "Acessórios", slug: "acessorios", icon: "🎧" },
            { nome: "Áudio", slug: "audio", icon: "🔊" },
            { nome: "Computadores", slug: "computadores", icon: "💻" },
            { nome: "Redes", slug: "redes", icon: "📡" },
            { nome: "Casa", slug: "casa-inteligente", icon: "🏠" },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/produtos?categoria=${cat.slug}`}
              className="group flex flex-col items-center rounded-xl border border-gray-100 bg-white p-6 text-center transition-all hover:border-primary-200 hover:shadow-md"
            >
              <span className="mb-3 text-3xl transition-transform group-hover:scale-110">
                {cat.icon}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                {cat.nome}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-primary-100 bg-primary-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Pronto para comprar?</h2>
        <p className="mb-6 text-gray-600">Crie a sua conta e comece a comprar hoje mesmo.</p>
        <Link href="/registo" className="btn-primary">
          Criar Conta Grátis
        </Link>
      </section>
    </div>
  );
}
