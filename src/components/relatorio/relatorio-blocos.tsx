/* eslint-disable @next/next/no-img-element -- a captura do PDF usa <img> comum, não next/image */
import {
  AMBIENTES,
  AMBIENTES_FOTO,
  CONDICOES,
  CONDICAO_LABEL,
  ESTADOS_GERAIS,
  MOVEIS,
  TESTES,
  formatarData,
  type Condicao,
  type Dados,
  type Foto,
  type Vistoria,
} from "@/lib/vistoria";

/** Unidade que nunca é cortada entre páginas. */
export type Bloco = {
  id: string;
  node: React.ReactNode;
  /** Não deixa o bloco sozinho no fim da página (títulos). */
  manterComProximo?: boolean;
  /** Começa numa página nova (anexo de fotos). */
  quebraAntes?: boolean;
};

const vazio = (s: string | null | undefined) => !s || !s.trim();

// ---------- Peças visuais ----------

function Selo({ c, ativo = true, tamanho = "md" }: { c: Condicao; ativo?: boolean; tamanho?: "sm" | "md" }) {
  const dims = tamanho === "sm" ? "h-[15px] w-[24px] text-[8px]" : "h-[17px] w-[30px] text-[9px]";
  if (!c) return <span className={`selo selo-vazio ${dims}`}>—</span>;
  return <span className={`selo ${dims} ${ativo ? `selo-${c}` : `selo-${c}-off`}`}>{c}</span>;
}

function TituloSecao({ n, titulo }: { n: number; titulo: string }) {
  return (
    <h2 className="border-b-2 border-ink pb-2 font-display text-[15px] font-bold text-brand">
      <span className="mr-3">{n}.</span>
      {titulo}
    </h2>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return <p className="text-[8.5px] font-medium tracking-[0.14em] text-muted uppercase">{children}</p>;
}

function Marcador({ marcado, children }: { marcado: boolean; children: React.ReactNode }) {
  return (
    <span className={`mr-5 inline-flex items-center gap-2 text-[11px] ${marcado ? "font-semibold text-ink" : "text-muted"}`}>
      <span className={`inline-block h-[11px] w-[11px] border ${marcado ? "border-brand bg-brand" : "border-strong-line bg-white"}`} />
      {children}
    </span>
  );
}

function Observacoes({ texto, rotulo = "Observações" }: { texto: string; rotulo?: string }) {
  return (
    <div className="flex gap-6 pt-3">
      <div className="w-[96px] shrink-0">
        <Rotulo>{rotulo}</Rotulo>
      </div>
      {vazio(texto) ? (
        <div className="mt-3 flex-1 border-b border-line" />
      ) : (
        <p className="flex-1 whitespace-pre-line text-[11px] leading-[1.6]">{texto}</p>
      )}
    </div>
  );
}

// ---------- Montagem ----------

export function montarBlocos(v: Vistoria, d: Dados, fotos: Foto[], fotoSrc: Record<string, string>): Bloco[] {
  const blocos: Bloco[] = [];
  const add = (b: Bloco) => blocos.push(b);

  add({
    id: "capa",
    node: (
      <div className="pb-7">
        <div className="flex items-end justify-between border-b-2 border-ink pb-7">
          <div>
            <p className="text-[9.5px] font-semibold tracking-[0.2em] text-sage uppercase">Cerro Imóveis · Vistoria</p>
            <h1 className="mt-2 font-display text-[28px] leading-[1.05] font-extrabold text-brand">
              Relatório de
              <br />
              Vistoria de Imóvel
            </h1>
          </div>
          <img src="/brand/cerro-logo.png" alt="" className="h-[70px] w-auto" />
        </div>
      </div>
    ),
  });

  // 1. Identificação
  const cel = (rotulo: string, valor: string | null | undefined, i: number) => (
    <div key={rotulo} className={`border-b border-line py-3 ${i % 2 === 0 ? "border-r pr-4" : "pl-4"}`}>
      <Rotulo>{rotulo}</Rotulo>
      <p className="mt-1.5 min-h-[16px] text-[12px] font-semibold">{valor || ""}</p>
    </div>
  );
  add({
    id: "s1",
    node: (
      <div className="pb-8">
        <TituloSecao n={1} titulo="Identificação do imóvel" />
        <div className="grid grid-cols-2 border-t-2 border-ink">
          {[
            ["Condomínio/Edifício", v.edificio],
            ["Endereço", v.endereco],
            ["Número do apartamento", v.apartamento],
            ["Proprietário(s)", v.proprietario],
            ["Corretor(a) responsável", v.corretor],
            ["Data da vistoria", formatarData(v.data_vistoria)],
            ["Área privativa", vazio(v.area_privativa) ? "" : `${v.area_privativa} m²`],
            ["Vaga(s)", v.vagas],
          ].map(([r, val], i) => cel(r!, val, i))}
        </div>
        <div className="border-b border-line py-3">
          <Rotulo>Situação</Rotulo>
          <div className="mt-2">
            <Marcador marcado={v.situacao === "ocupado"}>Ocupado</Marcador>
            <Marcador marcado={v.situacao === "desocupado"}>Desocupado</Marcador>
          </div>
        </div>
      </div>
    ),
  });

  // 2. Checklist
  add({
    id: "s2",
    manterComProximo: true,
    node: (
      <div className="pb-6">
        <TituloSecao n={2} titulo="Checklist de conservação" />
        <div className="mt-3 flex items-center gap-4 text-[10.5px]">
          <span className="text-muted">Condição observada:</span>
          {CONDICOES.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5">
              <Selo c={c} tamanho="sm" /> {CONDICAO_LABEL[c]}
            </span>
          ))}
        </div>
      </div>
    ),
  });

  for (const a of AMBIENTES) {
    const amb = d.ambientes[a.id];
    add({
      id: `amb-${a.id}`,
      node: (
        <div className="pb-7">
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <h3 className="font-display text-[12.5px] font-bold">{a.nome}</h3>
            <div className="flex items-center gap-1">
              <span className="mr-2 text-[8.5px] font-medium tracking-[0.14em] text-muted uppercase">Condição</span>
              {CONDICOES.map((c) => (
                <Selo key={c} c={c} tamanho="sm" ativo={amb.condicao === c} />
              ))}
            </div>
          </div>
          {a.itens.map((item, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line py-[5px] text-[11px]">
              <Selo c={amb.itens[i] ?? ""} />
              {item}
            </div>
          ))}
          <Observacoes texto={amb.obs} />
        </div>
      ),
    });
  }

  // 3. Testes
  add({
    id: "s3",
    node: (
      <div className="pb-8">
        <TituloSecao n={3} titulo="Testes de instalações e equipamentos" />
        <div className="grid grid-cols-2 gap-x-6">
          {TESTES.map((t, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line py-[5px] text-[11px]">
              <Selo c={d.testes[i] ?? ""} />
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
  });

  // 4. Ocorrências
  const ocorrencias = d.ocorrencias.filter((o) => !vazio(o.ambiente) || !vazio(o.descricao) || !vazio(o.foto) || !vazio(o.providencia));
  add({
    id: "s4",
    manterComProximo: true,
    node: (
      <div className={ocorrencias.length ? "" : "pb-8"}>
        <TituloSecao n={4} titulo="Avarias, defeitos e pendências" />
        {!ocorrencias.length && <p className="pt-3 text-[11px] text-muted">Nenhuma ocorrência registrada.</p>}
      </div>
    ),
  });
  ocorrencias.forEach((o, i) =>
    add({
      id: `oc-${i}`,
      node: (
        <div className={`flex gap-6 border-b border-line py-3 ${i === ocorrencias.length - 1 ? "mb-8" : ""}`}>
          <p className="w-[110px] shrink-0 text-[11px] font-bold">Ocorrência {i + 1}</p>
          <div className="flex-1 space-y-1.5 text-[11px]">
            {[
              ["Ambiente/local", o.ambiente],
              ["Descrição", o.descricao],
              ["Foto nº", o.foto],
              ["Providência a definir", o.providencia],
            ].map(([r, val]) => (
              <div key={r} className="flex gap-4">
                <span className="w-[130px] shrink-0 text-muted">{r}</span>
                <span className="flex-1 whitespace-pre-line">{val}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    }),
  );

  // 5. Móveis
  add({
    id: "s5",
    node: (
      <div className="pb-8">
        <TituloSecao n={5} titulo="Móveis e equipamentos que permanecerão no imóvel" />
        <div className="grid grid-cols-[200px_1fr_140px] border-b border-ink py-2 text-[8.5px] font-medium tracking-[0.14em] text-muted uppercase">
          <span>Item</span>
          <span>Quantidade/descrição</span>
          <span>Estado</span>
        </div>
        {MOVEIS.map((m, i) => (
          <div key={i} className="grid grid-cols-[200px_1fr_140px] border-b border-line py-2.5 text-[11px]">
            <span className="font-semibold">{m}</span>
            <span>{d.moveis[i]?.qtd}</span>
            <span>{d.moveis[i]?.estado}</span>
          </div>
        ))}
      </div>
    ),
  });

  // 6. Registro fotográfico
  add({
    id: "s6",
    node: (
      <div className="pb-8">
        <TituloSecao n={6} titulo="Registro fotográfico" />
        <div className="grid grid-cols-2 border-b border-line">
          <div className="border-r py-3 pr-4">
            <Rotulo>Fotos realizadas</Rotulo>
            <div className="mt-2">
              <Marcador marcado={fotos.length > 0}>Sim</Marcador>
              <Marcador marcado={fotos.length === 0}>Não</Marcador>
            </div>
          </div>
          <div className="py-3 pl-4">
            <Rotulo>Quantidade</Rotulo>
            <p className="mt-1.5 text-[12px] font-semibold">{fotos.length ? `${fotos.length} · ver Anexo` : "—"}</p>
          </div>
        </div>
      </div>
    ),
  });

  // 7. Conclusão
  add({
    id: "s7",
    node: (
      <div className="pb-8">
        <TituloSecao n={7} titulo="Conclusão da vistoria" />
        <div className="pt-3">
          <Rotulo>Estado geral observado</Rotulo>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {ESTADOS_GERAIS.map((e) => (
            <div
              key={e}
              className={`h-[60px] border p-3 text-[11px] ${d.estado_geral === e ? "border-brand bg-brand font-semibold text-white" : "border-line text-muted"}`}
            >
              {e}
            </div>
          ))}
        </div>
        <Observacoes texto={d.obs_final} rotulo="Observações adicionais" />
      </div>
    ),
  });

  // 8. Ciência — data de geração do documento (fuso de Brasília; a prévia roda no servidor em UTC)
  const dataImpressao = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const assinatura = (nome: string | null, papel: string) => (
    <div>
      <p className="min-h-[16px] text-[11px] font-semibold">{nome}</p>
      <div className="border-b border-ink" />
      <p className="mt-1.5 text-[10px] text-muted">{papel}</p>
      <div className="mt-12 border-b border-ink" />
      <p className="mt-1.5 text-[10px] text-muted">Assinatura</p>
    </div>
  );
  add({
    id: "s8",
    node: (
      <div className="pb-4">
        <TituloSecao n={8} titulo="Ciência das partes" />
        <p className="pt-3 text-[11px] leading-[1.65]">
          Este relatório registra as condições aparentes verificadas na data da vistoria. Não constitui laudo técnico de engenharia, avaliação de
          valor de mercado ou confirmação de regularidade documental. A vistoria não substitui a análise jurídica e documental do imóvel.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-10">
          {assinatura(v.proprietario, "Proprietário(a)")}
          {assinatura(v.corretor, "Corretor(a)")}
        </div>
        <p className="mt-10 text-[10px] text-muted">
          Data <span className="ml-2 inline-block w-[150px] border-b border-ink text-center text-ink">{dataImpressao}</span>
        </p>
        <p className="mt-8 text-[9.5px] leading-[1.6] text-muted">
          As assinaturas registram ciência das observações descritas, sem substituir as obrigações e condições previstas no instrumento contratual
          da negociação.
        </p>
      </div>
    ),
  });

  // Anexo de fotos: agrupado por ambiente, 3 por linha
  if (fotos.length) {
    add({
      id: "anexo",
      quebraAntes: true,
      manterComProximo: true,
      node: (
        <div className="pb-5">
          <p className="text-[9.5px] font-semibold tracking-[0.2em] text-sage uppercase">Anexo</p>
          <div className="mt-1 flex items-end justify-between border-b-2 border-ink pb-2">
            <h2 className="font-display text-[20px] font-extrabold text-brand">Registro fotográfico</h2>
            <span className="text-[12px] text-muted">{fotos.length} fotos</span>
          </div>
        </div>
      ),
    });

    let n = 0;
    for (const amb of AMBIENTES_FOTO) {
      const doAmb = fotos.filter((f) => f.ambiente === amb.id);
      if (!doAmb.length) continue;
      add({
        id: `fa-${amb.id}`,
        manterComProximo: true,
        node: <h3 className="pb-3 font-display text-[12.5px] font-bold">{amb.nome}</h3>,
      });
      for (let i = 0; i < doAmb.length; i += 3) {
        const linha = doAmb.slice(i, i + 3).map((f) => ({ f, num: ++n }));
        add({
          id: `fl-${amb.id}-${i}`,
          node: (
            <div className="grid grid-cols-3 gap-[14px] pb-5">
              {linha.map(({ f, num }) => (
                <figure key={f.id}>
                  <div className="h-[163px] overflow-hidden bg-line">
                    {fotoSrc[f.id] && <img src={fotoSrc[f.id]} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <figcaption className="mt-1.5 flex gap-2 text-[9.5px] leading-tight">
                    <strong className="shrink-0">Foto {String(num).padStart(2, "0")}</strong>
                    <span className="text-muted">{f.legenda}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ),
        });
      }
    }
  }

  return blocos;
}
