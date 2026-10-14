"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Eye, FilePdf, Plus, Trash } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { FotosAmbiente } from "@/components/fotos-ambiente";
import { GerarPdfButton } from "@/components/relatorio/gerar-pdf-button";
import { ExcluirVistoriaButton } from "@/components/excluir-vistoria-button";
import {
  AMBIENTES,
  BUCKET,
  CONDICOES,
  CONDICAO_LABEL,
  ESTADOS_GERAIS,
  MOVEIS,
  TESTES,
  normalizarDados,
  ordenarFotos,
  type Condicao,
  type Dados,
  type Foto,
  type Vistoria,
} from "@/lib/vistoria";

type Status = "salvo" | "pendente" | "salvando" | "erro";

function salvar(v: Vistoria, d: Dados) {
  return createClient()
    .from("vistoria_relatorios")
    .update({
      edificio: v.edificio,
      endereco: v.endereco,
      apartamento: v.apartamento,
      proprietario: v.proprietario,
      corretor: v.corretor,
      data_vistoria: v.data_vistoria || null,
      area_privativa: v.area_privativa,
      vagas: v.vagas,
      situacao: v.situacao,
      dados: d,
    })
    .eq("id", v.id);
}

export function VistoriaForm({ inicial, fotosIniciais }: { inicial: Vistoria; fotosIniciais: Foto[] }) {
  const [v, setV] = useState<Vistoria>(inicial);
  const [d, setD] = useState<Dados>(() => normalizarDados(inicial.dados));
  const [fotos, setFotos] = useState<Foto[]>(fotosIniciais);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("salvo");
  const primeiro = useRef(true);
  const pendente = useRef<{ v: Vistoria; d: Dados } | null>(null);

  // ---------- Salvamento automático (debounce) ----------
  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    pendente.current = { v, d };
    setStatus("pendente");
    const t = setTimeout(async () => {
      pendente.current = null;
      setStatus("salvando");
      const { error } = await salvar(v, d);
      setStatus(error ? "erro" : "salvo");
    }, 800);
    return () => clearTimeout(t);
  }, [v, d]);

  // Saiu da tela antes do debounce disparar: grava o que ficou pendente
  useEffect(
    () => () => {
      if (pendente.current) salvar(pendente.current.v, pendente.current.d);
    },
    [],
  );

  // Avisa antes de sair com alteração ainda não salva
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (status !== "salvo") e.preventDefault();
    };
    addEventListener("beforeunload", aviso);
    return () => removeEventListener("beforeunload", aviso);
  }, [status]);

  // ---------- URLs assinadas das fotos (bucket privado) ----------
  useEffect(() => {
    const faltando = fotos.map((f) => f.path).filter((p) => !urls[p]);
    if (!faltando.length) return;
    createClient()
      .storage.from(BUCKET)
      .createSignedUrls(faltando, 60 * 60 * 6)
      .then(({ data }) => {
        if (!data) return;
        setUrls((u) => ({ ...u, ...Object.fromEntries(data.filter((x) => x.signedUrl).map((x) => [x.path!, x.signedUrl!])) }));
      });
  }, [fotos, urls]);

  const fotosOrdenadas = useMemo(() => ordenarFotos(fotos), [fotos]);
  const numeros = useMemo(() => new Map(fotosOrdenadas.map((f, i) => [f.id, i + 1])), [fotosOrdenadas]);

  const campo = (k: keyof Vistoria) => ({
    value: (v[k] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }),
  });

  function setAmbiente(id: string, patch: Partial<Dados["ambientes"][string]>) {
    setD({ ...d, ambientes: { ...d.ambientes, [id]: { ...d.ambientes[id], ...patch } } });
  }

  const fotosProps = { vistoriaId: v.id, fotos, numeros, urls, onChange: setFotos };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft /> Vistorias
        </Link>
        <StatusSalvo status={status} />
      </div>

      <Secao n={1} titulo="Identificação do imóvel">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo label="Condomínio/Edifício" className="sm:col-span-2"><input className="campo" {...campo("edificio")} /></Campo>
          <Campo label="Endereço" className="sm:col-span-2"><input className="campo" {...campo("endereco")} /></Campo>
          <Campo label="Número do apartamento"><input className="campo" {...campo("apartamento")} /></Campo>
          <Campo label="Data da vistoria"><input type="date" className="campo" {...campo("data_vistoria")} /></Campo>
          <Campo label="Proprietário(s)"><input className="campo" {...campo("proprietario")} /></Campo>
          <Campo label="Corretor(a) responsável"><input className="campo" {...campo("corretor")} /></Campo>
          <Campo label="Área privativa (m²)"><input inputMode="decimal" className="campo" {...campo("area_privativa")} /></Campo>
          <Campo label="Vaga(s)"><input inputMode="numeric" className="campo" {...campo("vagas")} /></Campo>
          <Campo label="Situação" className="sm:col-span-2 lg:col-span-4">
            <Opcoes
              opcoes={[["ocupado", "Ocupado"], ["desocupado", "Desocupado"]]}
              valor={v.situacao ?? ""}
              onChange={(s) => setV({ ...v, situacao: (s || null) as Vistoria["situacao"] })}
            />
          </Campo>
        </div>
      </Secao>

      <Secao n={2} titulo="Checklist de conservação" extra={<Legenda />}>
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {AMBIENTES.map((a) => {
            const amb = d.ambientes[a.id];
            return (
              <div key={a.id} className="rounded-md border bg-surface p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="font-display text-base font-bold text-brand">{a.nome}</h3>
                  <button
                    type="button"
                    className="text-xs font-semibold text-sage hover:text-brand"
                    onClick={() =>
                      setAmbiente(a.id, {
                        itens: Object.fromEntries(a.itens.map((_, i) => [i, "B" as Condicao])),
                        condicao: "B",
                      })
                    }
                  >
                    Tudo B
                  </button>
                </div>
                <ul className="divide-y">
                  {a.itens.map((item, i) => (
                    <LinhaCondicao
                      key={i}
                      texto={item}
                      valor={amb.itens[i] ?? ""}
                      onChange={(c) => setAmbiente(a.id, { itens: { ...amb.itens, [i]: c } })}
                    />
                  ))}
                  <LinhaCondicao
                    texto="Condição geral"
                    destaque
                    valor={amb.condicao}
                    onChange={(c) => setAmbiente(a.id, { condicao: c })}
                  />
                </ul>
                <textarea
                  className="campo mt-3 min-h-20"
                  placeholder="Observações"
                  value={amb.obs}
                  onChange={(e) => setAmbiente(a.id, { obs: e.target.value })}
                />
                <FotosAmbiente ambiente={a.id} {...fotosProps} />
              </div>
            );
          })}
        </div>
      </Secao>

      <Secao
        n={3}
        titulo="Testes de instalações e equipamentos"
        extra={
          <button
            type="button"
            className="text-xs font-semibold text-sage hover:text-brand"
            onClick={() => setD({ ...d, testes: Object.fromEntries(TESTES.map((_, i) => [i, "B" as Condicao])) })}
          >
            Tudo B
          </button>
        }
      >
        <ul className="grid rounded-md border bg-surface px-4 lg:grid-cols-2 lg:gap-x-8 [&>li]:border-b [&>li]:border-line">
          {TESTES.map((t, i) => (
            <LinhaCondicao key={i} texto={t} valor={d.testes[i] ?? ""} onChange={(c) => setD({ ...d, testes: { ...d.testes, [i]: c } })} />
          ))}
        </ul>
      </Secao>

      <Secao n={4} titulo="Avarias, defeitos e pendências">
        <div className="grid items-start gap-3 lg:grid-cols-2">
          {d.ocorrencias.map((o, i) => {
            const set = (patch: Partial<typeof o>) =>
              setD({ ...d, ocorrencias: d.ocorrencias.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <div key={i} className="rounded-md border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">Ocorrência {i + 1}</p>
                  <button
                    type="button"
                    aria-label="Remover ocorrência"
                    className="text-muted hover:text-alert"
                    onClick={() => setD({ ...d, ocorrencias: d.ocorrencias.filter((_, j) => j !== i) })}
                  >
                    <Trash />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Ambiente/local"><input className="campo" value={o.ambiente} onChange={(e) => set({ ambiente: e.target.value })} /></Campo>
                  <Campo label="Foto nº"><input className="campo" placeholder="Ex.: 12, 13" value={o.foto} onChange={(e) => set({ foto: e.target.value })} /></Campo>
                  <Campo label="Descrição" className="sm:col-span-2">
                    <textarea className="campo min-h-20" value={o.descricao} onChange={(e) => set({ descricao: e.target.value })} />
                  </Campo>
                  <Campo label="Providência a definir" className="sm:col-span-2">
                    <input className="campo" value={o.providencia} onChange={(e) => set({ providencia: e.target.value })} />
                  </Campo>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className="btn w-full lg:col-span-2"
            onClick={() => setD({ ...d, ocorrencias: [...d.ocorrencias, { ambiente: "", descricao: "", foto: "", providencia: "" }] })}
          >
            <Plus /> Adicionar ocorrência
          </button>
        </div>
      </Secao>

      <Secao n={5} titulo="Móveis e equipamentos que permanecerão">
        <div className="divide-y rounded-md border bg-surface">
          {MOVEIS.map((m, i) => {
            const atual = d.moveis[i] ?? { qtd: "", estado: "" };
            const set = (patch: Partial<typeof atual>) => setD({ ...d, moveis: { ...d.moveis, [i]: { ...atual, ...patch } } });
            return (
              <div key={i} className="grid gap-2 p-4 sm:grid-cols-[150px_1fr_140px] sm:items-center">
                <p className="text-sm font-semibold">{m}</p>
                <input className="campo" placeholder="Quantidade/descrição" value={atual.qtd} onChange={(e) => set({ qtd: e.target.value })} />
                <input className="campo" placeholder="Estado" value={atual.estado} onChange={(e) => set({ estado: e.target.value })} />
              </div>
            );
          })}
        </div>
      </Secao>

      <Secao n={6} titulo="Registro fotográfico">
        <div className="rounded-md border bg-surface p-4">
          <p className="text-sm">
            <strong>{fotos.length}</strong> {fotos.length === 1 ? "foto anexada" : "fotos anexadas"} — as fotos de cada ambiente são enviadas no
            checklist acima. Use o campo abaixo para fotos gerais (fachada, garagem, áreas comuns…).
          </p>
          <FotosAmbiente ambiente="outros" {...fotosProps} />
        </div>
      </Secao>

      <Secao n={7} titulo="Conclusão da vistoria">
        <div className="space-y-4 rounded-md border bg-surface p-4">
          <Campo label="Estado geral observado">
            <Opcoes opcoes={ESTADOS_GERAIS.map((e) => [e, e])} valor={d.estado_geral} onChange={(e) => setD({ ...d, estado_geral: e })} />
          </Campo>
          <Campo label="Observações adicionais">
            <textarea className="campo min-h-24" value={d.obs_final} onChange={(e) => setD({ ...d, obs_final: e.target.value })} />
          </Campo>
        </div>
      </Secao>

      <div className="pt-2">
        <ExcluirVistoriaButton id={v.id} nome={[v.edificio || "Sem nome", v.apartamento && `Ap. ${v.apartamento}`].filter(Boolean).join(" · ")} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <StatusSalvo status={status} />
          <div className="flex gap-2">
            <Link href={`/vistorias/${v.id}`} className={`btn ${status === "pendente" || status === "salvando" ? "pointer-events-none opacity-50" : ""}`}>
              <Eye size={18} /> Ver
            </Link>
            <GerarPdfButton vistoria={v} dados={d} fotos={fotosOrdenadas} disabled={status === "pendente" || status === "salvando"}>
              <FilePdf size={18} weight="bold" /> Gerar PDF
            </GerarPdfButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Peças de UI ----------

function Secao({ n, titulo, extra, children }: { n: number; titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="pt-2">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-b-2 border-brand pb-2">
        <h2 className="font-display text-[17px] font-bold text-brand">
          <span className="mr-2 text-sage">{n}.</span>
          {titulo}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Campo({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function LinhaCondicao({ texto, valor, onChange, destaque }: { texto: string; valor: Condicao; onChange: (c: Condicao) => void; destaque?: boolean }) {
  return (
    <li className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2.5 ${destaque ? "font-semibold" : ""}`}>
      <span className="min-w-0 flex-1 basis-48 text-sm">{texto}</span>
      <div className="flex gap-1">
        {CONDICOES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={valor === c}
            onClick={() => onChange(valor === c ? "" : c)}
            className={`selo h-9 w-11 text-xs ${valor === c ? `selo-${c}` : `selo-${c}-off`}`}
          >
            {c}
          </button>
        ))}
      </div>
    </li>
  );
}

function Opcoes({ opcoes, valor, onChange }: { opcoes: string[][]; valor: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={valor === id}
          onClick={() => onChange(valor === id ? "" : id)}
          className={`rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
            valor === id ? "border-brand bg-brand text-white" : "bg-surface text-ink hover:border-strong-line"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Legenda() {
  return (
    <p className="flex flex-wrap justify-end gap-x-2.5 gap-y-1 text-[11px] text-muted">
      {CONDICOES.map((c) => (
        <span key={c} className="inline-flex items-center gap-1">
          <span className={`selo selo-${c} h-4 w-6 text-[9px]`}>{c}</span>
          {CONDICAO_LABEL[c]}
        </span>
      ))}
    </p>
  );
}

function StatusSalvo({ status }: { status: Status }) {
  const txt = { salvo: "Salvo", pendente: "Alterado…", salvando: "Salvando…", erro: "Erro ao salvar" }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${status === "erro" ? "text-alert" : "text-muted"}`}>
      {status === "salvo" && <Check weight="bold" className="text-sage" />}
      {txt}
    </span>
  );
}
