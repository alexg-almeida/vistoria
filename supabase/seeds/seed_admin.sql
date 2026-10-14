-- =============================================================================
-- Cerro Vistoria · cria (ou reaproveita) o login admin e libera o acesso.
-- Uso: psql "$SUPABASE_DB_URL" -v email='...' -v senha='...' \
--        -f supabase/seeds/seed_admin.sql
-- Se o e-mail já existe em auth.users (ex.: usuário do Atma), só libera o
-- acesso — a senha existente não é alterada.
-- =============================================================================

\set ON_ERROR_STOP on

select set_config('seed.email', :'email', false);
select set_config('seed.senha', :'senha', false);

do $$
declare
  v_email text := current_setting('seed.email');
  v_senha text := current_setting('seed.senha');
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, extensions.crypt(v_senha, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('nome_completo', 'Vistoria Cerro'),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text, 'email',
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      now(), now(), now()
    );
    raise notice 'Usuário % criado.', v_email;
  end if;

  insert into public.vistoria_usuarios (user_id) values (v_user_id) on conflict do nothing;
  raise notice 'Acesso à vistoria liberado para %.', v_email;
end;
$$;
