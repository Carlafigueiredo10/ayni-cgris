export type Registro = {
  id?: string;
  user_id?: string;
  servidor?: string;
  data: string;
  processo: string;
  status: "Concluido" | "Encaminhado" | "Solicitada informacao externa";
  minutos: number;
  documentoOuAcao?: string[];
  sistemaAjuste?: string;
  tipoNatureza?: string;
  tipoProcesso?: string;
  tipoControle?: string;
  motivoTempo?: string;
  numPaginas?: string;
  assunto?: string;
  familiaridade?: string;
  outroMotivo?: string;
  reincidenciaTipo?: "none" | "self" | "other";
  reincidenciaRespostas?: Record<string, unknown>;
};

export type RegistroDB = {
  id: string;
  user_id: string;
  servidor: string | null;
  data: string;
  processo: string;
  status: string;
  minutos: number;
  documento_ou_acao: string[] | null;
  sistema_ajuste: string | null;
  tipo_natureza: string | null;
  tipo_processo: string | null;
  tipo_controle: string | null;
  motivo_tempo: string | null;
  num_paginas: string | null;
  assunto: string | null;
  familiaridade: string | null;
  outro_motivo: string | null;
  team_id: string | null;
  reincidencia_tipo: string | null;
  reincidencia_respostas: Record<string, unknown> | null;
  created_at: string;
};

export type ReincidenciaResult = {
  reincidence_type: "none" | "self" | "other";
  previous_count: number;
  same_server_count: number;
  different_server_count: number;
};
