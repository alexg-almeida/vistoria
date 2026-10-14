"use client";

import { useRef, useState } from "react";
import { Camera, Trash } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { comprimirImagem } from "@/lib/imagem";
import { BUCKET, type Foto } from "@/lib/vistoria";

type Props = {
  vistoriaId: string;
  ambiente: string;
  fotos: Foto[]; // todas as fotos da vistoria
  numeros: Map<string, number>; // numeração global (ordem do anexo)
  urls: Record<string, string>; // path -> signed URL
  onChange: (fotos: Foto[]) => void;
};

export function FotosAmbiente({ vistoriaId, ambiente, fotos, numeros, urls, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const doAmbiente = fotos.filter((f) => f.ambiente === ambiente).sort((a, b) => a.ordem - b.ordem);

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const supabase = createClient();
    const lista = Array.from(arquivos);
    let ordem = Math.max(0, ...doAmbiente.map((f) => f.ordem));
    let atuais = fotos;
    const falhas: string[] = [];
    setErro(null);

    for (let i = 0; i < lista.length; i++) {
      setProgresso(`Enviando ${i + 1} de ${lista.length}…`);
      try {
        const blob = await comprimirImagem(lista[i]);
        const path = `${vistoriaId}/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        const { data, error } = await supabase
          .from("vistoria_fotos")
          .insert({ vistoria_id: vistoriaId, ambiente, path, ordem: ++ordem })
          .select()
          .single();
        if (error) throw error;
        atuais = [...atuais, data as Foto];
        onChange(atuais);
      } catch {
        falhas.push(lista[i].name);
      }
    }
    setProgresso(null);
    if (falhas.length) setErro(`Não foi possível enviar: ${falhas.join(", ")}`);
    if (input.current) input.current.value = "";
  }

  async function excluir(foto: Foto) {
    if (!confirm(`Excluir a foto ${numeros.get(foto.id)}?`)) return;
    const supabase = createClient();
    // Foto enviada por engano não é dado de negócio: exclusão física (linha + arquivo).
    const { error } = await supabase.from("vistoria_fotos").delete().eq("id", foto.id);
    if (error) return setErro("Não foi possível excluir a foto.");
    await supabase.storage.from(BUCKET).remove([foto.path]);
    onChange(fotos.filter((f) => f.id !== foto.id));
  }

  async function salvarLegenda(foto: Foto, legenda: string) {
    if ((foto.legenda ?? "") === legenda) return;
    await createClient().from("vistoria_fotos").update({ legenda }).eq("id", foto.id);
    onChange(fotos.map((f) => (f.id === foto.id ? { ...f, legenda } : f)));
  }

  return (
    <div className="mt-4">
      {doAmbiente.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {doAmbiente.map((f) => (
            <li key={f.id} className="min-w-0">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-line">
                {urls[f.path] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[f.path]} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-1 top-1 rounded-[3px] bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {String(numeros.get(f.id)).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => excluir(f)}
                  aria-label="Excluir foto"
                  className="absolute right-1 top-1 rounded-[3px] bg-white/90 p-1 text-alert"
                >
                  <Trash size={14} weight="bold" />
                </button>
              </div>
              <input
                defaultValue={f.legenda ?? ""}
                onBlur={(e) => salvarLegenda(f, e.target.value.trim())}
                placeholder="Legenda"
                className="mt-1 w-full border-0 border-b border-line bg-transparent px-0.5 py-1 text-xs outline-none focus:border-brand"
              />
            </li>
          ))}
        </ul>
      )}

      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => enviar(e.target.files)} />
      <button type="button" className="btn w-full border-dashed text-muted" disabled={!!progresso} onClick={() => input.current?.click()}>
        <Camera size={18} /> {progresso ?? (doAmbiente.length ? "Adicionar mais fotos" : "Adicionar fotos")}
      </button>
      {erro && <p className="mt-2 text-sm text-alert">{erro}</p>}
    </div>
  );
}
