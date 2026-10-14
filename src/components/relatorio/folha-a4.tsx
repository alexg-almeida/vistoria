"use client";

import { useEffect, useRef, useState } from "react";
import { A4_PX } from "@/lib/capturar-paginas";

/** Folha com largura de A4 reduzida (zoom) para caber na tela sem rolagem lateral. */
export function FolhaA4({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = ref.current!;
    const obs = new ResizeObserver(() => setZoom(Math.min(1, el.clientWidth / A4_PX.width)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex justify-center">
      <div style={{ width: A4_PX.width, zoom }} className="rounded-md border bg-white px-14 py-12 text-ink shadow-sm">
        {children}
      </div>
    </div>
  );
}
