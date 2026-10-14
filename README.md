# Cerro Vistoria

Formulário de vistoria de imóveis + geração do relatório em PDF. Next.js 16 · Supabase · Tailwind v4.

- `src/lib/vistoria.ts` — estrutura do checklist (ambientes, itens, testes, móveis). Formulário e PDF saem daqui.
- `src/components/vistoria-form.tsx` — formulário com salvamento automático.
- `src/components/fotos-ambiente.tsx` — upload múltiplo de fotos por ambiente (comprimidas no navegador).
- `src/components/relatorio/` — montagem, paginação e captura do PDF.

## Banco

Usa o Supabase do Atma CRM. Tudo com prefixo `vistoria_` (bucket `vistoria-fotos`, privado).
`auth.users` é compartilhado, então o acesso depende da tabela `vistoria_usuarios`.

```bash
psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 -f supabase/migrations/20261014120000_vistoria_inicial.sql
psql "$SUPABASE_DB_URL" -v email='vistoria@cerroimoveis.com.br' -v senha='<senha forte>' -f supabase/seeds/seed_admin.sql
```

## Desenvolvimento

```bash
npm install
npm run dev -- -p 3220
```

`.env.local`: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ver `.env.example`).

## Deploy (EasyPanel)

App do tipo **Dockerfile** apontando para este repositório. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` **nos dois lugares**: Build Variables (embutidas no bundle) e env vars de runtime (lidas pelo `proxy.ts`). Porta `3000`.
