import { VistoriaForm } from "@/components/vistoria-form";
import { carregarVistoria } from "@/lib/carregar-vistoria";

export default async function EditarVistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { vistoria, fotos } = await carregarVistoria((await params).id);
  return <VistoriaForm inicial={vistoria} fotosIniciais={fotos} />;
}
