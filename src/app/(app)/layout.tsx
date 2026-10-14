import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // auth.users é compartilhado com o Atma CRM: estar logado não basta.
  const { data: temAcesso, error } = await supabase.rpc("vistoria_tem_acesso");
  if (error) throw new Error(`Banco da vistoria não configurado (migration aplicada?): ${error.message}`);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-brand/80 bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/cerro-simbolo.png" alt="" width={525} height={340} className="h-6 w-auto" />
            <span className="font-display text-[15px] font-bold tracking-wide text-brand">CERRO</span>
            <span className="eyebrow hidden sm:inline">Vistoria</span>
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-muted hover:text-ink">Sair</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6">
        {temAcesso ? (
          children
        ) : (
          <p className="rounded-md border bg-surface p-6 text-sm">
            O usuário <strong>{user.email}</strong> não tem acesso ao sistema de vistoria.
          </p>
        )}
      </main>
    </>
  );
}
