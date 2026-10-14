# Cerro · Design system

Base: logo Cerro Imóveis (`public/brand/`). Tokens em `src/app/globals.css` (Tailwind v4, `@theme inline`).

## Cores

| Token | Hex | Uso |
|---|---|---|
| `brand` | `#2a361d` | Verde-escuro da logo. Botão primário, títulos, selo **B**, linhas fortes |
| `sage` | `#8aa650` | Verde da logo. Acento: números de seção, eyebrow, links secundários |
| `sage-soft` | `#e6ecd8` | Fundo do selo **R**, hover de lista |
| `alert` | `#a8170f` | Selo **Ru**, erros, excluir |
| `ink` | `#1f2618` | Texto |
| `muted` | `#6a7060` | Texto secundário, rótulos |
| `bg` | `#f4f4ef` | Fundo da aplicação (papel) |
| `surface` | `#ffffff` | Cartões, campos |
| `line` / `strong-line` | `#dcdfd3` / `#b4baa8` | Divisórias / bordas em hover |

## Tipografia

- **Archivo** (`font-display`, 600–800): títulos e seções.
- **Inter** (`font-sans`): todo o resto.
- `.eyebrow`: rótulo 11px, caixa alta, tracking 0.14em, cor `muted`.

## Componentes (classes em `globals.css`)

- `.campo` — input/textarea.
- `.btn`, `.btn-primario` — botões.
- `.selo` + `.selo-B | -R | -Ru | -NT | -NA | -off` — selo de condição; o mesmo no formulário e no PDF.

## PDF

A4 (794×1123px) capturado com html2canvas → jsPDF. Cabeçalho com régua `ink` de 2px, rodapé com data e paginação, seções numeradas com régua de 2px. Não usar modificadores de opacidade do Tailwind (`/50`) dentro do PDF — geram `color-mix()`, que o html2canvas não interpreta.
