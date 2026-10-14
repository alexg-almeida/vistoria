import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { criarVistoria } from "../actions";

const CAMPOS = [
  { name: "edificio", label: "Condomínio/Edifício", full: true, required: true },
  { name: "endereco", label: "Endereço", full: true },
  { name: "apartamento", label: "Número do apartamento" },
  { name: "data_vistoria", label: "Data da vistoria", type: "date" },
  { name: "proprietario", label: "Proprietário(s)" },
  { name: "corretor", label: "Corretor(a) responsável" },
  { name: "area_privativa", label: "Área privativa (m²)", inputMode: "decimal" as const },
  { name: "vagas", label: "Vaga(s)", inputMode: "numeric" as const },
];

export default function NovaVistoriaPage() {
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); // yyyy-mm-dd

  return (
    <>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft /> Vistorias
      </Link>
      <h1 className="font-display text-2xl font-bold text-brand">Nova vistoria</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Identifique o imóvel. O checklist e as fotos vêm na próxima tela.</p>

      <form action={criarVistoria} className="rounded-md border bg-surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {CAMPOS.map((c) => (
            <label key={c.name} className={`block ${c.full ? "sm:col-span-2" : ""}`}>
              <span className="eyebrow mb-1.5 block">{c.label}</span>
              <input
                name={c.name}
                type={c.type ?? "text"}
                inputMode={c.inputMode}
                required={c.required}
                defaultValue={c.name === "data_vistoria" ? hoje : undefined}
                className="campo"
              />
            </label>
          ))}
          <fieldset className="sm:col-span-2">
            <legend className="eyebrow mb-1.5">Situação</legend>
            <div className="flex gap-2">
              {[
                ["ocupado", "Ocupado"],
                ["desocupado", "Desocupado"],
              ].map(([v, l]) => (
                <label
                  key={v}
                  className="cursor-pointer rounded-md border px-4 py-2.5 text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
                >
                  <input type="radio" name="situacao" value={v} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Link href="/" className="btn">
            Cancelar
          </Link>
          <button className="btn btn-primario">Criar e continuar</button>
        </div>
      </form>
    </>
  );
}
