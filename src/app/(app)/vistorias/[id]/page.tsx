import Link from "next/link";
import { ArrowLeft, FilePdf, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { carregarVistoria } from "@/lib/carregar-vistoria";
import { BUCKET, normalizarDados } from "@/lib/vistoria";
import { montarBlocos } from "@/components/relatorio/relatorio-blocos";
import { GerarPdfButton } from "@/components/relatorio/gerar-pdf-button";
import { FolhaA4 } from "@/components/relatorio/folha-a4";
import { ExcluirVistoriaButton } from "@/components/excluir-vistoria-button";

export default async function VerVistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase, vistoria, fotos } = await carregarVistoria((await params).id);
  const dados = normalizarDados(vistoria.dados);

  // Fotos do bucket privado: URLs assinadas só para esta visualização
  const fotoSrc: Record<string, string> = {};
  if (fotos.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(fotos.map((f) => f.path), 60 * 60);
    data?.forEach((s, i) => s.signedUrl && (fotoSrc[fotos[i].id] = s.signedUrl));
  }

  const nome = [vistoria.edificio || "Sem nome", vistoria.apartamento && `Ap. ${vistoria.apartamento}`].filter(Boolean).join(" · ");

  return (
    <>
      <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft /> Vistorias
      </Link>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brand">{nome}</h1>
        <div className="flex flex-wrap gap-2">
          <ExcluirVistoriaButton id={vistoria.id} nome={nome} />
          <Link href={`/vistorias/${vistoria.id}/editar`} className="btn">
            <PencilSimple size={18} /> Editar
          </Link>
          <GerarPdfButton vistoria={vistoria} dados={dados} fotos={fotos}>
            <FilePdf size={18} weight="bold" /> Gerar PDF
          </GerarPdfButton>
        </div>
      </div>

      {/* Prévia do relatório: mesmos blocos do PDF, numa folha com largura de A4 */}
      <FolhaA4>
        {montarBlocos(vistoria, dados, fotos, fotoSrc).map((b) => (
          <div key={b.id} className={b.quebraAntes ? "mt-10 border-t border-dashed pt-10" : ""}>
            {b.node}
          </div>
        ))}
      </FolhaA4>
    </>
  );
}
