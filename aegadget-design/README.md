# AEGADGET — Design (Fase 1: Web)

Protótipo visual estático (HTML/CSS/JS, sem build) da loja AEGADGET. Serve como referência de design para o Cursor implementar em Next.js + Tailwind, conforme o prompt de arquitetura já definido.

Abre `index.html` diretamente no navegador para veres o protótipo — não precisas de `npm install` nem servidor.

## Direção de design — "Carga total"

O conceito liga o produto (gadgets/eletrónica) ao vocabulário visual da energia: portas de carregamento, indicadores de bateria, traços de circuito. O elemento de assinatura é o **canto cortado** dos cartões (`.notch-card`), inspirado no canto de um cartão SIM/porta USB-C — aparece em produtos, categorias e blocos do painel admin.

### Paleta
| Nome | Hex | Uso |
|---|---|---|
| `--ink` | `#17130F` | Texto principal, fundos escuros (footer, sidebar admin) |
| `--white` | `#FFFFFF` | Fundo base |
| `--paper` | `#FFFBF8` | Fundo suave de cartões/secções |
| `--orange` | `#FF5A1F` | Cor de marca — CTAs, acentos |
| `--orange-deep` | `#C7390B` | Hover, texto sobre laranja suave |
| `--orange-soft` | `#FFE6D6` | Fundos suaves, badges |
| `--amber` | `#FFB020` | Segundo acento (faísca), usado com moderação |
| `--hairline` / `--hairline-2` | `#F0DECF` / `#E7D2BE` | Linhas divisórias, bordas |

### Tipografia
- **Archivo Black** — display/hero (títulos grandes, maiúsculas)
- **Space Grotesk** — títulos de secção, navegação, botões
- **Inter** — corpo de texto
- **JetBrains Mono** — preços, SKUs, stock, etiquetas técnicas (dá o ar "gadget/dados")

Carregadas via Google Fonts no `<head>` de cada página. Se preferires alojar localmente no Next.js, usa `next/font/google` com os mesmos nomes.

## Estrutura de ficheiros

```
aegadget-design/
├── index.html          → Página inicial (hero, categorias, destaques)
├── produtos.html        → Listagem com filtros, pesquisa e paginação
├── produto.html          → Detalhe do produto (galeria, separadores, avaliações)
├── carrinho.html         → Carrinho de compras
├── checkout.html         → Morada de entrega + método de pagamento
├── login.html / registo.html → Autenticação (layout partilhado)
├── admin.html             → Painel AEGADGET (dashboard, encomendas, stock, produtos)
├── assets/
│   ├── css/style.css     → Sistema de design completo (tokens + componentes)
│   └── js/main.js        → Interações do protótipo (menu, tabs, quantidade, validação)
└── README.md
```

## Como levar isto para o Cursor

1. Descompacta a pasta dentro de `/apps/web` (ou numa pasta `design-reference/` à parte, para não confundir com o projeto Next.js real).
2. No prompt do Cursor, referencia este ficheiro e o `style.css` como fonte da verdade do design system — pede para converter as classes e tokens CSS em Tailwind config (`tailwind.config.ts`) + componentes React reutilizáveis (`Button`, `ProductCard`, `NotchCard`, `Badge`, `ChargeIndicator`).
3. Os textos já estão em português de Angola e os preços já formatados como `1.250.000,00 Kz` — mantém esse padrão nos componentes dinâmicos.
4. O `.notch-card` (canto cortado) usa `clip-path`; ao converter para componente, mantém a variável `--notch` para poderes ajustar o tamanho do corte por breakpoint.
5. Os ícones são SVGs inline desenhados à mão (sem biblioteca externa) — podes trocar por `lucide-react` mantendo o `stroke-width:1.5` para preservar o estilo de traço fino.

## O que ainda falta (por design, não por esquecimento)

Este é um protótipo **visual**, não funcional — os botões "Adicionar ao carrinho", formulários e filtros só simulam comportamento em JS puro. Liga tudo à API real seguindo o plano faseado (Fase A–E) já definido no prompt do projeto.
