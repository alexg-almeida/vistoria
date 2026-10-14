"use client";

import { useTransition } from "react";
import { Trash } from "@phosphor-icons/react";
import { excluirVistoria } from "@/app/(app)/vistorias/actions";

export function ExcluirVistoriaButton({ id, nome, compacto }: { id: string; nome: string; compacto?: boolean }) {
  const [pendente, iniciar] = useTransition();

  function excluir() {
    if (!confirm(`Excluir a vistoria "${nome}"?`)) return;
    iniciar(() => excluirVistoria(id));
  }

  return compacto ? (
    <button type="button" onClick={excluir} disabled={pendente} aria-label={`Excluir ${nome}`} className="rounded-md p-2 text-muted hover:bg-[#fdf0ef] hover:text-alert">
      <Trash size={18} />
    </button>
  ) : (
    <button type="button" onClick={excluir} disabled={pendente} className="btn text-alert hover:border-alert">
      <Trash size={18} /> {pendente ? "Excluindo…" : "Excluir"}
    </button>
  );
}
