// Estrutura fixa do relatório de vistoria. Formulário e PDF são gerados a
// partir destas listas — para mudar um item, mude aqui.

export const CONDICOES = ["B", "R", "Ru", "NT", "NA"] as const;
export type Condicao = (typeof CONDICOES)[number] | "";

export const CONDICAO_LABEL: Record<(typeof CONDICOES)[number], string> = {
  B: "Bom",
  R: "Regular",
  Ru: "Ruim",
  NT: "Não testado",
  NA: "Não se aplica",
};

export const AMBIENTES = [
  {
    id: "entrada",
    nome: "Entrada, portas e fechaduras",
    itens: [
      "Portas e batentes em bom estado",
      "Fechaduras, maçanetas e dobradiças funcionando",
      "Paredes e pintura sem danos aparentes",
    ],
  },
  {
    id: "sala",
    nome: "Sala e circulação",
    itens: [
      "Paredes e teto sem trincas ou manchas",
      "Piso e rodapés em bom estado",
      "Janelas e esquadrias funcionando",
      "Tomadas, interruptores e iluminação",
      "Sinais de umidade ou infiltração",
    ],
  },
  {
    id: "cozinha",
    nome: "Cozinha",
    itens: [
      "Armários, gavetas, dobradiças e puxadores",
      "Bancadas, cuba e torneiras",
      "Sifões e possíveis vazamentos",
      "Revestimentos, rejuntes e piso",
      "Tomadas e iluminação",
      "Eletrodomésticos que permanecerão no imóvel",
    ],
  },
  {
    id: "lavanderia",
    nome: "Lavanderia e área de serviço",
    itens: [
      "Tanque e torneiras",
      "Ralos e escoamento",
      "Armários e bancada",
      "Sinais de umidade ou vazamentos",
    ],
  },
  {
    id: "quartos",
    nome: "Quartos e suítes",
    itens: [
      "Paredes, teto e pintura",
      "Piso e rodapés",
      "Portas, janelas e fechaduras",
      "Armários planejados",
      "Tomadas e iluminação",
      "Ar-condicionado e controles, se houver",
      "Manchas de umidade ou sinais de infiltração",
    ],
  },
  {
    id: "banheiros",
    nome: "Banheiros",
    itens: [
      "Torneiras, registros e duchas",
      "Descargas e vasos sanitários",
      "Box, vidros e vedação",
      "Ralos e escoamento",
      "Gabinetes e espelhos",
      "Rejuntes e revestimentos",
      "Sinais de vazamentos ou infiltração",
    ],
  },
  {
    id: "sacada",
    nome: "Sacada ou varanda",
    itens: [
      "Piso e revestimentos",
      "Guarda-corpo e esquadrias",
      "Ralos e escoamento",
      "Sinais de infiltração",
      "Churrasqueira e acessórios, se houver",
    ],
  },
] as const;

// Fotos são agrupadas pelos mesmos ambientes do checklist + "Outros".
export const AMBIENTES_FOTO = [
  ...AMBIENTES.map((a) => ({ id: a.id, nome: a.nome })),
  { id: "outros", nome: "Outros" },
];

export const TESTES = [
  "Torneiras e pressão da água",
  "Verificação visual de vazamentos",
  "Interruptores e iluminação",
  "Tomadas acessíveis",
  "Portas, janelas e armários",
  "Ar-condicionado",
  "Interfone e campainha",
];

export const MOVEIS = [
  "Móveis planejados",
  "Ar-condicionado",
  "Eletrodomésticos",
  "Luminárias",
  "Cortinas e persianas",
  "Outros",
];

export const ESTADOS_GERAIS = [
  "Bom",
  "Regular",
  "Necessita de reparos",
  "Requer avaliação técnica",
];

export type Ocorrencia = {
  ambiente: string;
  descricao: string;
  foto: string;
  providencia: string;
};

/** Conteúdo da coluna `dados` (jsonb). Chaves de itens = índice na lista acima. */
export type Dados = {
  ambientes: Record<string, { itens: Record<string, Condicao>; condicao: Condicao; obs: string }>;
  testes: Record<string, Condicao>;
  ocorrencias: Ocorrencia[];
  moveis: Record<string, { qtd: string; estado: string }>;
  estado_geral: string;
  obs_final: string;
};

export type Vistoria = {
  id: string;
  created_at: string;
  edificio: string | null;
  endereco: string | null;
  apartamento: string | null;
  proprietario: string | null;
  corretor: string | null;
  data_vistoria: string | null;
  area_privativa: string | null;
  vagas: string | null;
  situacao: "ocupado" | "desocupado" | null;
  dados: Partial<Dados>;
};

export type Foto = {
  id: string;
  vistoria_id: string;
  ambiente: string;
  path: string;
  legenda: string | null;
  ordem: number;
  created_at: string;
};

/** Preenche chaves ausentes — o jsonb pode vir vazio ou de uma versão anterior. */
export function normalizarDados(d: Partial<Dados> | null | undefined): Dados {
  return {
    ambientes: Object.fromEntries(
      AMBIENTES.map((a) => {
        const atual = d?.ambientes?.[a.id];
        return [a.id, { itens: atual?.itens ?? {}, condicao: atual?.condicao ?? "", obs: atual?.obs ?? "" }];
      }),
    ),
    testes: d?.testes ?? {},
    ocorrencias: d?.ocorrencias ?? [],
    moveis: d?.moveis ?? {},
    estado_geral: d?.estado_geral ?? "",
    obs_final: d?.obs_final ?? "",
  };
}

/** Ordena fotos na ordem do anexo (por ambiente, depois por ordem de envio). */
export function ordenarFotos(fotos: Foto[]): Foto[] {
  const pos = (id: string) => AMBIENTES_FOTO.findIndex((a) => a.id === id);
  return [...fotos].sort(
    (a, b) => pos(a.ambiente) - pos(b.ambiente) || a.ordem - b.ordem || a.created_at.localeCompare(b.created_at),
  );
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export const BUCKET = "vistoria-fotos";
