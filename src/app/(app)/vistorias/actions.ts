"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const texto = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;

export async function criarVistoria(form: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vistoria_relatorios")
    .insert({
      edificio: texto(form, "edificio"),
      endereco: texto(form, "endereco"),
      apartamento: texto(form, "apartamento"),
      proprietario: texto(form, "proprietario"),
      corretor: texto(form, "corretor"),
      data_vistoria: texto(form, "data_vistoria"),
      area_privativa: texto(form, "area_privativa"),
      vagas: texto(form, "vagas"),
      situacao: texto(form, "situacao"),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect(`/vistorias/${data.id}/editar`);
}

/** Exclusão lógica (ativo = false): some da lista, mas o registro e as fotos ficam no banco. */
export async function excluirVistoria(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vistoria_relatorios").update({ ativo: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}
