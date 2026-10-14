import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VistoriaForm } from "@/components/vistoria-form";
import type { Foto, Vistoria } from "@/lib/vistoria";

export default async function VistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: vistoria }, { data: fotos }] = await Promise.all([
    supabase.from("vistoria_relatorios").select("*").eq("id", id).eq("ativo", true).maybeSingle(),
    supabase.from("vistoria_fotos").select("*").eq("vistoria_id", id).eq("ativo", true),
  ]);
  if (!vistoria) notFound();

  return <VistoriaForm inicial={vistoria as Vistoria} fotosIniciais={(fotos ?? []) as Foto[]} />;
}
