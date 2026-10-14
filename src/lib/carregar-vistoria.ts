import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ordenarFotos, type Foto, type Vistoria } from "@/lib/vistoria";

/** Vistoria ativa + fotos na ordem do anexo; 404 se não existir ou estiver excluída. */
export async function carregarVistoria(id: string) {
  const supabase = await createClient();
  const [{ data: vistoria }, { data: fotos }] = await Promise.all([
    supabase.from("vistoria_relatorios").select("*").eq("id", id).eq("ativo", true).maybeSingle(),
    supabase.from("vistoria_fotos").select("*").eq("vistoria_id", id).eq("ativo", true),
  ]);
  if (!vistoria) notFound();
  return { supabase, vistoria: vistoria as Vistoria, fotos: ordenarFotos((fotos ?? []) as Foto[]) };
}
