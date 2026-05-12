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
  fase?: string;
  tipoAto?: string;
  subtipoAto?: string;
  cpf?: string;
  classificacao?: string;
  acordaoTcuTipo?: string;
  assuntoJudicial?: string;
  assuntoJudicialOutros?: string;
  multa?: boolean;
  multaDestinatario?: string;
  multaPeriodicidade?: string;
  multaFaixa?: string;
  encaminhadoPara?: string[];
  encaminhadoParaOutros?: string;
  trilha?: string;
  acaoColetivaFaixa?: string;
  loteIndiciosFaixa?: string;
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
  fase: string | null;
  tipo_ato: string | null;
  subtipo_ato: string | null;
  cpf: string | null;
  classificacao: string | null;
  acordao_tcu_tipo: string | null;
  assunto_judicial: string | null;
  assunto_judicial_outros: string | null;
  multa: boolean | null;
  multa_destinatario: string | null;
  multa_periodicidade: string | null;
  multa_faixa: string | null;
  encaminhado_para: string | null;
  encaminhado_para_outros: string | null;
  trilha: string | null;
  acao_coletiva_faixa: string | null;
  lote_indicios_faixa: string | null;
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
  last_status: string | null;
  already_concluded: boolean;
};

export type ProcessoLastJudicial = {
  tipo_processo: string | null;
  assunto_judicial: string | null;
  assunto_judicial_outros: string | null;
};

export type CpfHistoryResult = {
  total_registros: number;
  processos_distintos: number;
  ultimo_processo: string | null;
  ultimo_status: string | null;
  ultima_data: string | null;
};

export type ScoreRow = {
  registro_id: string;
  processo: string;
  data: string;
  status: string;
  assunto_slug: string;
  atuacao_num: number;
  multiplicador: number;
  peso_assunto: number;
  fator_status: number;
  pontos: number;
};
