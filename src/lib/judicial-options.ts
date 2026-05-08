// Listas placeholder. Carla deve substituir pelos valores oficiais antes de usar em producao.

export type Option = { v: string; l: string };

// Assunto judicial - lista distinta por tipo de processo
export const ASSUNTOS_SUBSIDIO: Option[] = [
  { v: "gratificacao_desempenho", l: "Gratificação de desempenho" },
  { v: "auxilio_alimentacao", l: "Auxílio-alimentação" },
  { v: "incorporacao_funcao", l: "Incorporação de função" },
  { v: "progressao_funcional", l: "Progressão funcional" },
  { v: "anistia", l: "Anistia" },
  { v: "outros", l: "Outros (descrever)" },
];

export const ASSUNTOS_CUMPRIMENTO: Option[] = [
  { v: "implantacao_rubrica", l: "Implantação de rubrica" },
  { v: "exclusao_rubrica", l: "Exclusão de rubrica" },
  { v: "pagamento_atrasados", l: "Pagamento de atrasados" },
  { v: "revisao_proventos", l: "Revisão de proventos" },
  { v: "restituicao", l: "Restituição ao erário" },
  { v: "outros", l: "Outros (descrever)" },
];

export function getAssuntosByTipo(tipoProcesso?: string): Option[] {
  if (tipoProcesso === "subsidio") return ASSUNTOS_SUBSIDIO;
  if (tipoProcesso === "cumprimento") return ASSUNTOS_CUMPRIMENTO;
  return [];
}

// Faixas de multa - 5 placeholders (Carla ajustara conforme tabela do AJ)
export const FAIXAS_MULTA: Option[] = [
  { v: "faixa_1", l: "Faixa 1 — até R$ 1.000" },
  { v: "faixa_2", l: "Faixa 2 — R$ 1.000 a R$ 10.000" },
  { v: "faixa_3", l: "Faixa 3 — R$ 10.000 a R$ 50.000" },
  { v: "faixa_4", l: "Faixa 4 — R$ 50.000 a R$ 200.000" },
  { v: "faixa_5", l: "Faixa 5 — acima de R$ 200.000" },
];

// Areas para Encaminhamento (status = 'Encaminhado') — tipos judicial e controle
export const AREAS_ENCAMINHAMENTO: Option[] = [
  { v: "cgris_interno", l: "CGRIS — área interna" },
  { v: "aj", l: "AJ" },
  { v: "digep", l: "DIGEP" },
  { v: "cgben", l: "CGBEN" },
  { v: "cgpag", l: "CGPAG" },
  { v: "outros", l: "Outros (descrever)" },
];

// Areas para Encaminhamento quando tipo = atos (fluxo proprio do NATOS)
export const AREAS_ENCAMINHAMENTO_ATOS: Option[] = [
  { v: "para_revisao", l: "Para Revisão" },
  { v: "solicitacao_afd", l: "Solicitação AFD" },
  { v: "outros", l: "Outros (descrever)" },
];

// Faixas para justificativa "Ação coletiva" (motivo do tempo elevado)
export const FAIXAS_ACAO_COLETIVA: Option[] = [
  { v: "2_10", l: "2 a 10" },
  { v: "10_40", l: "10 a 40" },
  { v: "40_100", l: "40 a 100" },
  { v: "mais_100", l: "Mais de 100" },
];

// Faixas para justificativa "Análise em lote de indícios"
export const FAIXAS_LOTE_INDICIOS: Option[] = [
  { v: "ate_100", l: "Até 100" },
  { v: "100_500", l: "100 a 500" },
  { v: "mais_500", l: "Mais de 500" },
];
