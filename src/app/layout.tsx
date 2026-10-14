import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "Vistoria · Cerro Imóveis",
  description: "Relatórios de vistoria de imóveis da Cerro Imóveis",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${archivo.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
