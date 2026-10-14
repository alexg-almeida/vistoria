"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { A4_PX, aguardarFontes, aguardarImagens, capturarPaginasComoPdf } from "@/lib/capturar-paginas";
import { BUCKET, formatarData, type Dados, type Foto, type Vistoria } from "@/lib/vistoria";
import { montarBlocos, type Bloco } from "./relatorio-blocos";

const PAD_X = 56;
const CONTEUDO_TOPO = 84; // abaixo do cabeçalho
const CONTEUDO_BASE = 64; // acima do rodapé
const ALTURA_UTIL = A4_PX.height - CONTEUDO_TOPO - CONTEUDO_BASE;
const LARGURA_CONTEUDO = A4_PX.width - PAD_X * 2;

const proximoFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** Distribui blocos em páginas (greedy), respeitando quebraAntes e manterComProximo. */
function paginar(blocos: Bloco[], alturas: number[]): Bloco[][] {
  const paginas: Bloco[][] = [[]];
  let usado = 0;
  blocos.forEach((b, i) => {
    let precisa = alturas[i];
    if (b.manterComProximo && i + 1 < blocos.length) precisa += alturas[i + 1];
    const atual = paginas[paginas.length - 1];
    if (atual.length && (b.quebraAntes || usado + precisa > ALTURA_UTIL)) {
      paginas.push([]);
      usado = 0;
    }
    paginas[paginas.length - 1].push(b);
    usado += alturas[i];
  });
  return paginas;
}

type Props = { vistoria: Vistoria; dados: Dados; fotos: Foto[]; disabled?: boolean; children: React.ReactNode };

export function GerarPdfButton({ vistoria, dados, fotos, disabled, children }: Props) {
  const [fase, setFase] = useState<string | null>(null);
  const [blocos, setBlocos] = useState<Bloco[] | null>(null);
  const [paginas, setPaginas] = useState<Bloco[][] | null>(null);

  const cabecalho = ["Relatório de vistoria", vistoria.edificio && `Ed. ${vistoria.edificio.replace(/^ed(\.|if[ií]cio)\s*/i, "")}`, vistoria.apartamento && `Ap. ${vistoria.apartamento}`]
    .filter(Boolean)
    .join(" · ");

  async function gerar() {
    const objectUrls: string[] = [];
    try {
      // 1. Baixa as fotos como blob (mesma origem para o html2canvas, sem CORS)
      const fotoSrc: Record<string, string> = {};
      if (fotos.length) {
        setFase(`Carregando fotos…`);
        const supabase = createClient();
        for (let i = 0; i < fotos.length; i++) {
          setFase(`Carregando fotos ${i + 1}/${fotos.length}…`);
          const { data } = await supabase.storage.from(BUCKET).download(fotos[i].path);
          if (data) {
            const url = URL.createObjectURL(data);
            objectUrls.push(url);
            fotoSrc[fotos[i].id] = url;
          }
        }
      }

      // 2. Mede os blocos fora da tela e pagina
      setFase("Montando páginas…");
      await aguardarFontes();
      const lista = montarBlocos(vistoria, dados, fotos, fotoSrc);
      setBlocos(lista);
      await proximoFrame();
      const medidor = document.getElementById("relatorio-medidor")!;
      await aguardarImagens(medidor);
      const alturas = Array.from(medidor.children).map((el) => el.getBoundingClientRect().height);
      const pags = paginar(lista, alturas);
      setBlocos(null);
      setPaginas(pags);
      await proximoFrame();

      // 3. Captura cada página
      setFase("Gerando PDF…");
      const els = Array.from(document.querySelectorAll<HTMLElement>("#relatorio-render [data-pagina]"));
      const doc = await capturarPaginasComoPdf(els, {
        title: `Relatório de vistoria · ${cabecalho}`,
        subject: "Relatório de vistoria de imóvel",
        author: "Cerro Imóveis",
        creator: "Cerro Vistoria",
      });
      const nome = ["Vistoria", vistoria.edificio, vistoria.apartamento && `ap ${vistoria.apartamento}`, formatarData(vistoria.data_vistoria).replace(/\//g, "-")]
        .filter(Boolean)
        .join(" - ");
      doc.save(`${nome}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setBlocos(null);
      setPaginas(null);
      setFase(null);
      objectUrls.forEach(URL.revokeObjectURL);
    }
  }

  const foraDaTela: React.CSSProperties = { position: "fixed", top: 0, left: -10000, zIndex: -1 };

  return (
    <>
      <button type="button" className="btn btn-primario" disabled={disabled || !!fase} onClick={gerar}>
        {fase ?? children}
      </button>

      {blocos &&
        createPortal(
          <div id="relatorio-medidor" aria-hidden style={{ ...foraDaTela, width: LARGURA_CONTEUDO }} className="bg-white text-ink">
            {blocos.map((b) => (
              <div key={b.id}>{b.node}</div>
            ))}
          </div>,
          document.body,
        )}

      {paginas &&
        createPortal(
          <div id="relatorio-render" aria-hidden style={foraDaTela}>
            {paginas.map((pag, i) => (
              <div
                key={i}
                data-pagina
                style={{ width: A4_PX.width, height: A4_PX.height }}
                className="relative overflow-hidden bg-white text-ink"
              >
                <div className="absolute inset-x-0 top-0 flex h-[52px] items-end justify-between border-b-2 border-ink px-14 pb-3 text-[9.5px] tracking-[0.14em] uppercase">
                  <span>Cerro Imóveis</span>
                  <span>{cabecalho}</span>
                </div>
                <div className="absolute px-14" style={{ top: CONTEUDO_TOPO, left: 0, right: 0 }}>
                  {pag.map((b) => (
                    <div key={b.id}>{b.node}</div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex h-[44px] items-start justify-between border-t border-line px-14 pt-3 text-[10px] text-muted">
                  <span>Vistoria realizada em {formatarData(vistoria.data_vistoria)}</span>
                  <span>
                    Documento de registro de condições aparentes · {i + 1}/{paginas.length}
                  </span>
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
