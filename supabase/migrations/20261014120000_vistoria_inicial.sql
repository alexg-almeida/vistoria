-- =============================================================================
-- Cerro Vistoria · schema inicial
-- Roda no mesmo Supabase do Atma CRM: auth.users é compartilhado, por isso o
-- acesso é restrito a uma lista explícita (vistoria_usuarios) e não a
-- "qualquer usuário autenticado".
-- =============================================================================

-- Quem pode usar o sistema de vistoria
create table public.vistoria_usuarios (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.vistoria_usuarios enable row level security;
create policy "vistoria_usuarios: ver a si mesmo" on public.vistoria_usuarios
  for select to authenticated using (user_id = (select auth.uid()));

create function public.vistoria_tem_acesso() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.vistoria_usuarios where user_id = (select auth.uid()));
$$;
grant execute on function public.vistoria_tem_acesso() to authenticated;

create function public.vistoria_set_updated_at() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Relatórios: identificação em colunas (listagem/busca); checklist,
-- testes, ocorrências, móveis e conclusão em `dados` (estrutura fixa
-- definida no código, src/lib/vistoria.ts).
create table public.vistoria_relatorios (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users default auth.uid(),
  ativo boolean not null default true,
  edificio text,
  endereco text,
  apartamento text,
  proprietario text,
  corretor text,
  data_vistoria date default current_date,
  area_privativa text,
  vagas text,
  situacao text check (situacao in ('ocupado', 'desocupado')),
  dados jsonb not null default '{}'::jsonb
);
create index vistoria_relatorios_ativo_data_idx on public.vistoria_relatorios (ativo, data_vistoria desc);
create trigger vistoria_relatorios_updated_at before update on public.vistoria_relatorios
  for each row execute function public.vistoria_set_updated_at();
alter table public.vistoria_relatorios enable row level security;
create policy "vistoria_relatorios: acesso" on public.vistoria_relatorios
  for all to authenticated
  using ((select public.vistoria_tem_acesso()))
  with check ((select public.vistoria_tem_acesso()));

-- Fotos (arquivo no bucket privado vistoria-fotos)
create table public.vistoria_fotos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users default auth.uid(),
  ativo boolean not null default true,
  vistoria_id uuid not null references public.vistoria_relatorios on delete cascade,
  ambiente text not null,
  path text not null,
  legenda text,
  ordem int not null default 0
);
create index vistoria_fotos_vistoria_idx on public.vistoria_fotos (vistoria_id);
create trigger vistoria_fotos_updated_at before update on public.vistoria_fotos
  for each row execute function public.vistoria_set_updated_at();
alter table public.vistoria_fotos enable row level security;
create policy "vistoria_fotos: acesso" on public.vistoria_fotos
  for all to authenticated
  using ((select public.vistoria_tem_acesso()))
  with check ((select public.vistoria_tem_acesso()));

-- Storage: bucket privado (fotos de imóveis ocupados não ficam públicas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vistoria-fotos', 'vistoria-fotos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "vistoria-fotos: acesso" on storage.objects
  for all to authenticated
  using (bucket_id = 'vistoria-fotos' and (select public.vistoria_tem_acesso()))
  with check (bucket_id = 'vistoria-fotos' and (select public.vistoria_tem_acesso()));
