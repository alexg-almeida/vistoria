"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      setEnviando(false);
      setErro(error.code === "invalid_credentials" ? "E-mail ou senha inválidos." : "Não foi possível entrar. Tente novamente.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-16">
      <Image src="/brand/cerro-logo.png" alt="Cerro Imóveis" width={1489} height={604} priority className="mx-auto h-auto w-52" />
      <p className="eyebrow mt-6 text-center">Relatórios de vistoria</p>

      <form onSubmit={entrar} className="mt-10 space-y-5">
        <label className="block">
          <span className="eyebrow mb-1.5 block">E-mail</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Senha</span>
          <input type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="campo" />
        </label>
        {erro && <p role="alert" className="text-sm text-alert">{erro}</p>}
        <button type="submit" disabled={enviando} className="btn btn-primario w-full py-3">
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
