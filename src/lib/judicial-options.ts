// Listas placeholder. Carla deve substituir pelos valores oficiais antes de usar em producao.

export type Option = { v: string; l: string };

// Assunto judicial - lista distinta por tipo de processo (CGRIS, abr/2026)
// Subsídio e Cumprimento compartilham a mesma lista (abas ESUB/ECUMP da planilha)
export const ASSUNTOS_SUB_CUMP: Option[] = [
  { v: "abate_teto", l: "Abate Teto" },
  { v: "acumulacao_cargos", l: "Acumulação de Cargos" },
  { v: "alvara_judicial", l: "Alvará Judicial" },
  { v: "anistiado", l: "Anistiado" },
  { v: "aposentadoria_cassacao", l: "Aposentadoria - Cassação" },
  { v: "aposentadoria_concessao", l: "Aposentadoria - Concessão" },
  { v: "aposentadoria_restabelecimento", l: "Aposentadoria - Restabelecimento de Proventos" },
  { v: "aposentadoria_revisao", l: "Aposentadoria - Revisão" },
  { v: "ats_anuenio", l: "ATS/Anuênio" },
  { v: "auxilio_moradia", l: "Auxílio Moradia" },
  { v: "averbacao_tempo_contribuicao", l: "Averbação de Tempo de Contribuição" },
  { v: "bonus_eficiencia", l: "Bônus de Eficiência" },
  { v: "certidao_tempo_contribuicao", l: "Certidão de Tempo de Contribuição" },
  { v: "concessao_gratificacao", l: "Concessão de Gratificação" },
  { v: "contagem_tempo_especial", l: "Contagem de Tempo Especial" },
  { v: "curatela", l: "Curatela" },
  { v: "danos_morais", l: "Danos Morais" },
  { v: "desconto_folha_penhora", l: "Desconto em Folha - Penhora" },
  { v: "diaria_asilado", l: "Diária de Asilado" },
  { v: "diferenca_soldo", l: "Diferença de Soldo" },
  { v: "gratificacao_desempenho_diferenca", l: "Gratificação de Desempenho - Diferença" },
  { v: "gratificacao_titulacao_rsc", l: "Gratificação por Titulação - RSC" },
  { v: "informacoes_cadastrais", l: "Informações Cadastrais" },
  { v: "informacoes_financeiras", l: "Informações Financeiras" },
  { v: "inventario", l: "Inventário" },
  { v: "irpf", l: "IRPF" },
  { v: "pec_dnit", l: "PEC-DNIT" },
  { v: "pensao_retroativos", l: "Pensão - Retroativos (Exercícios Anteriores)" },
  { v: "pensao_alimenticia", l: "Pensão Alimentícia" },
  { v: "pensao_civil_concessao", l: "Pensão Civil - Concessão" },
  { v: "pensao_civil_restabelecimento", l: "Pensão Civil - Restabelecimento" },
  { v: "pensao_civil_revisao", l: "Pensão Civil - Revisão" },
  { v: "percentual_28_86", l: "Percentual de 28,86%" },
  { v: "percentual_3_17", l: "Percentual de 3,17%" },
  { v: "quintos", l: "Quintos" },
  { v: "reenquadramento_funcional", l: "Reenquadramento Funcional" },
  { v: "reposicao_erario", l: "Reposição ao Erário" },
  { v: "residuos_remuneratorios", l: "Resíduos Remuneratórios" },
  { v: "rgps", l: "RGPS" },
  { v: "transposicao", l: "Transposição" },
  { v: "vpe", l: "VPE" },
  { v: "vpni", l: "VPNI" },
  { v: "consulta_orgao_controle", l: "Consulta Decorrente de Órgão de Controle" },
  { v: "cadastro_aj", l: "Cadastro AJ" },
  { v: "vinculo_nao_decipex", l: "Vínculo não é com a Decipex" },
  { v: "tema_nao_decipex", l: "Tema não é da Decipex" },
  { v: "outros", l: "Outros (descrever)" },
];

// Aba EADM da planilha (tipo de processo Administrativo)
export const ASSUNTOS_ADMINISTRATIVO: Option[] = [
  { v: "reposicao_erario", l: "Reposição ao Erário" },
  { v: "rgps", l: "RGPS" },
  { v: "vpe", l: "VPE" },
  { v: "cumprimento_decisao_judicial", l: "Cumprimento de Decisão Judicial" },
  { v: "extensao_rubrica", l: "Extensão de Rubrica" },
  { v: "descontos_indevidos", l: "Descontos indevidos" },
  { v: "revisao_pensao", l: "Revisão de Pensão" },
  { v: "revisao_aposentadoria", l: "Revisão de Aposentadoria" },
  { v: "vinculo_nao_decipex", l: "Vínculo não é com a Decipex" },
  { v: "tema_nao_decipex", l: "Tema não é da Decipex" },
  { v: "outros", l: "Outros (descrever)" },
];

export function getAssuntosByTipo(tipoProcesso?: string): Option[] {
  if (tipoProcesso === "subsidio" || tipoProcesso === "cumprimento")
    return ASSUNTOS_SUB_CUMP;
  if (tipoProcesso === "administrativo") return ASSUNTOS_ADMINISTRATIVO;
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
  { v: "coate", l: "COATE" },
  { v: "cggaf", l: "CGGAF" },
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

// Fases das demandas de controle (COCON). O status (Concluido/Encaminhado/etc.)
// se refere a esta fase, nao ao processo inteiro — um processo pode
// ter notificacao concluida, depois defesa, depois recurso, etc.
export const FASES_CONTROLE: Option[] = [
  { v: "notificacao", l: "Notificação" },
  { v: "defesa", l: "Defesa" },
  { v: "recurso", l: "Recurso" },
  { v: "solicitacao_informacoes", l: "Solicitação de informações" },
];

// Trilhas oficiais da CGRIS (lista fechada — nao existem outras).
// Ordem definida pela Carla; o campo permite busca por digitacao.
export const TRILHAS: Option[] = [
  { v: "acumulacao_irregular_cargos", l: "Acumulação irregular de cargos" },
  { v: "acumulacao_irregular_vpni_quintos_gadf", l: "Acumulação irregular de VPNI Quintos ou Função Comissionada com a GADF" },
  { v: "aposentadoria_invalidez_retorno_atividade", l: "Aposentadoria por invalidez para beneficiário em condição de retornar à atividade" },
  { v: "ato_pessoal_avocado_controle_interno", l: "Ato de pessoal avocado do controle interno" },
  { v: "auxilio_alimentacao_duplicidade", l: "Auxílio alimentação pago em duplicidade" },
  { v: "auxilio_invalidez_outro_vinculo", l: "Auxílio invalidez para beneficiário em atividade em outro vínculo" },
  { v: "dedicacao_exclusiva_desrespeitada", l: "Dedicação exclusiva desrespeitada" },
  { v: "descumprimento_jornada_trabalho", l: "Descumprimento de jornada de trabalho" },
  { v: "inativo_sem_ato_concessao_aposentadoria", l: "Inativo sem ato de concessão de aposentadoria" },
  { v: "inconsistencia_datas_pensao", l: "Inconsistência de datas em pensão" },
  { v: "inobservancia_par1_art24_ec103", l: "Inobservância do §1º do Art. 24 da EC 103/2019" },
  { v: "inobservancia_par2_art24_ec103", l: "Inobservância do §2º do Art. 24 da EC 103/2019" },
  { v: "inobservancia_teto_pensionistas_outro_vinculo", l: "Inobservância do teto para pensionistas que possuem outro vínculo público" },
  { v: "manutencao_rubrica_contrariando_tcu", l: "Manutenção de rubrica em folha contrariando determinação do TCU" },
  { v: "pgto_indevido_parcela_judicial_28_86", l: "Pagamento indevido de parcela judicial 28,86%" },
  { v: "pgto_indevido_parcela_judicial_13_23", l: "Pagamento indevido de parcela judicial 13,23%" },
  { v: "parcela_incompativel_subsidio", l: "Parcela incompatível com subsídio" },
  { v: "pensionista_uniao_estavel_filha_maior_solteira", l: "Pensionista em união estável enquadrada como filha maior solteira" },
  { v: "pensionista_filha_maior_solteira_cargo_publico", l: "Pensionista enquadrada como filha maior solteira ocupando cargo público" },
  { v: "pensionista_falecido_com_remuneracao", l: "Pensionista falecido com remuneração" },
  { v: "pensionista_mantido_folha_ato_concessao_ilegal", l: "Pensionista mantido em folha, apesar do ato de concessão julgado ilegal" },
  { v: "reajuste_indevido_beneficio_especial_aposentadoria", l: "Reajuste indevido de Benefício Especial de aposentadoria" },
  { v: "reajuste_indevido_proventos_pensao", l: "Reajuste indevido de proventos de pensão" },
  { v: "redutor_pensao_ec41_insuficiente", l: "Redutor de pensão da EC 41/2003 insuficiente" },
  { v: "servidor_ativo_mais_75_anos", l: "Servidor ativo com mais de 75 anos" },
  { v: "servidor_mantido_inativo_aposentadoria_ilegal", l: "Servidor mantido em folha como inativo, apesar do ato de aposentadoria julgado ilegal" },
  { v: "servidor_mantido_folha_admissao_ilegal", l: "Servidor mantido em folha, apesar do ato de admissão julgado ilegal" },
];
