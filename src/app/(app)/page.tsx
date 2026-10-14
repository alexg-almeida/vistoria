import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { formatarData, type Vistoria } from "@/lib/vistoria";

async function novaVistoria() {
  "use server";
  const supabase = await createClient();
  const { data, error } = await supabase.from("vistoria_relatorios").insert({}).select("id").single();
  if (error) throw new Error(error.message);
  redirect(`/vistorias/${data.id}`);
}

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vistoria_relatorios")
    .select("id, edificio, apartamento, endereco, corretor, data_vistoria")
    .eq("ativo", true)
    .order("data_vistoria", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  const vistorias = (data ?? []) as Pick<Vistoria, "id" | "edificio" | "apartamento" | "endereco" | "corretor" | "data_vistoria">[];

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-sage">Cerro Imóveis</p>
          <h1 className="font-display text-2xl font-bold text-brand">Vistorias</h1>
        </div>
        <form action={novaVistoria}>
          <button className="btn btn-primario">
            <Plus weight="bold" /> Nova vistoria
          </button>
        </form>
      </div>

      {vistorias.length === 0 ? (
        <p className="rounded-md border bg-surface p-8 text-center text-sm text-muted">Nenhuma vistoria ainda.</p>
      ) : (
        <ul className="divide-y rounded-md border bg-surface">
          {vistorias.map((v) => (
            <li key={v.id}>
              <Link href={`/vistorias/${v.id}`} className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-sage-soft/40">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {v.edificio || "Sem nome"}
                    {v.apartamento && <span className="font-normal text-muted"> · Ap. {v.apartamento}</span>}
                  </p>
                  <p className="truncate text-sm text-muted">{[v.endereco, v.corretor].filter(Boolean).join(" · ") || "—"}</p>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-muted">{formatarData(v.data_vistoria)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
