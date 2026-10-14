import Link from "next/link";
import { MagnifyingGlass, PencilSimple, Plus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { ExcluirVistoriaButton } from "@/components/excluir-vistoria-button";
import { formatarData, type Vistoria } from "@/lib/vistoria";

type Linha = Pick<Vistoria, "id" | "edificio" | "apartamento" | "endereco" | "proprietario" | "corretor" | "data_vistoria">;

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const supabase = await createClient();

  let consulta = supabase
    .from("vistoria_relatorios")
    .select("id, edificio, apartamento, endereco, proprietario, corretor, data_vistoria")
    .eq("ativo", true)
    .order("data_vistoria", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (q) {
    // vírgula e parênteses quebram a sintaxe do filtro `or` do PostgREST
    const termo = `%${q.replace(/[,()]/g, " ")}%`;
    consulta = consulta.or(
      ["edificio", "endereco", "apartamento", "proprietario", "corretor"].map((c) => `${c}.ilike.${termo}`).join(","),
    );
  }
  const { data } = await consulta;
  const vistorias = (data ?? []) as Linha[];

  return (
    <>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-sage">Cerro Imóveis</p>
          <h1 className="font-display text-2xl font-bold text-brand">Vistorias</h1>
        </div>
        <Link href="/vistorias/nova" className="btn btn-primario">
          <Plus weight="bold" /> Nova vistoria
        </Link>
      </div>

      <form className="relative mb-4">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder="Buscar por edifício, endereço, apartamento, proprietário ou corretor" className="campo pl-9" />
      </form>

      {vistorias.length === 0 ? (
        <p className="rounded-md border bg-surface p-8 text-center text-sm text-muted">
          {q ? `Nenhuma vistoria encontrada para "${q}".` : "Nenhuma vistoria ainda."}
        </p>
      ) : (
        <ul className="divide-y rounded-md border bg-surface">
          {vistorias.map((v) => {
            const nome = [v.edificio || "Sem nome", v.apartamento && `Ap. ${v.apartamento}`].filter(Boolean).join(" · ");
            return (
              <li key={v.id} className="flex items-center gap-2 pr-2 hover:bg-[#f7f9f2]">
                <Link href={`/vistorias/${v.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{nome}</p>
                    <p className="truncate text-sm text-muted">
                      {[v.endereco, v.proprietario && `Prop. ${v.proprietario}`, v.corretor].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-muted">{formatarData(v.data_vistoria)}</span>
                </Link>
                <Link href={`/vistorias/${v.id}/editar`} aria-label={`Editar ${nome}`} className="rounded-md p-2 text-muted hover:bg-sage-soft hover:text-brand">
                  <PencilSimple size={18} />
                </Link>
                <ExcluirVistoriaButton id={v.id} nome={nome} compacto />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
