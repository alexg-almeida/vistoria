/**
 * Reduz a foto no navegador antes do upload (máx. 1600px no maior lado, JPEG
 * 0.82): uma foto de celular de ~4MB vira ~300KB, o que deixa o envio de dezenas
 * de fotos viável em 4G e o PDF final leve.
 */
export async function comprimirImagem(arquivo: File, maxLado = 1600, qualidade = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao comprimir a imagem."))), "image/jpeg", qualidade),
  );
}
