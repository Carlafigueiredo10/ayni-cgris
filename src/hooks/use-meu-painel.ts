import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type MeuItemTipo = "PROCESSO" | "TAREFA" | "LEMBRETE";
export type MeuItemPrioridade = "BAIXA" | "NORMAL" | "ALTA";
export type MeuItemOrigem = "PESSOAL" | "COORDENACAO";
export type MeuItemAcaoTipo = "MANUAL" | "SISTEMA";

export type MeuItem = {
  id: string;
  owner_id: string;
  owner_nome: string | null;
  tipo: MeuItemTipo;
  referencia: string | null;
  assunto: string;
  prioridade: MeuItemPrioridade;
  prazo: string | null;             // YYYY-MM-DD
  notify_email: boolean;
  pinned: boolean;
  concluido_em: string | null;
  origem: MeuItemOrigem;
  created_at: string;
  updated_at: string;
  ultima_acao_id: string | null;
  ultima_acao_descricao: string | null;
  ultima_acao_em: string | null;
  ultima_acao_tipo: MeuItemAcaoTipo | null;
  ultima_acao_por_id: string | null;
  ultima_acao_por_nome: string | null;
  ultima_acao_por_self: boolean | null;
};

export type MeuItemAcao = {
  id: string;
  tipo: MeuItemAcaoTipo;
  descricao: string;
  created_at: string;
  created_by: string | null;
  autor_nome: string | null;
  autor_self: boolean;
};

export type ServidorGerivel = {
  id: string;
  display_name: string | null;
  email: string | null;
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
};

// ------------------ Listagem ------------------

export function useMeuPainelItens(opts: {
  ownerId: string | null;          // null = self
  incluirConcluidos: boolean;
}) {
  const query = useQuery({
    queryKey: ["meu-painel", "itens", opts.ownerId ?? "self", opts.incluirConcluidos],
    queryFn: async (): Promise<MeuItem[]> => {
      const { data, error } = await supabase.rpc("meu_item_listar", {
        p_owner_id: opts.ownerId,
        p_incluir_concluidos: opts.incluirConcluidos,
      });
      if (error) throw error;
      return (data ?? []) as MeuItem[];
    },
  });
  return {
    itens: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useServidoresGeriveis() {
  return useQuery({
    queryKey: ["meu-painel", "servidores-geriveis"],
    queryFn: async (): Promise<ServidorGerivel[]> => {
      const { data, error } = await supabase.rpc("meu_painel_servidores_geriveis");
      if (error) throw error;
      return (data ?? []) as ServidorGerivel[];
    },
    staleTime: 60_000,
  });
}

export function useHistoricoItem(itemId: string | null, limit = 50) {
  return useQuery({
    queryKey: ["meu-painel", "historico", itemId, limit],
    enabled: !!itemId,
    queryFn: async (): Promise<MeuItemAcao[]> => {
      const { data, error } = await supabase.rpc("meu_item_historico", {
        p_item_id: itemId,
        p_limit: limit,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as MeuItemAcao[];
    },
  });
}

// ------------------ Mutations ------------------

function invalidateMeuPainel(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["meu-painel"] });
}

export function useCriarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      ownerId?: string | null;
      tipo: MeuItemTipo;
      referencia?: string | null;
      assunto: string;
      prioridade?: MeuItemPrioridade;
      prazo?: string | null;
      notifyEmail?: boolean;
      primeiraAcao?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("meu_item_criar", {
        p_owner_id: input.ownerId ?? null,
        p_tipo: input.tipo,
        p_referencia: input.referencia ?? null,
        p_assunto: input.assunto,
        p_prioridade: input.prioridade ?? "NORMAL",
        p_prazo: input.prazo ?? null,
        p_notify_email: input.notifyEmail ?? true,
        p_primeira_acao: input.primeiraAcao ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidateMeuPainel(qc),
  });
}

export function useRegistrarAcao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { itemId: string; descricao: string }) => {
      const { data, error } = await supabase.rpc("meu_item_registrar_acao", {
        p_item_id: input.itemId,
        p_descricao: input.descricao,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidateMeuPainel(qc),
  });
}

export function useAtualizarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      referencia?: string | null;
      assunto?: string | null;
      prazo?: string | null;
      limparPrazo?: boolean;
      prioridade?: MeuItemPrioridade | null;
      notifyEmail?: boolean | null;
      pinned?: boolean | null;
    }) => {
      const { error } = await supabase.rpc("meu_item_atualizar", {
        p_id: input.id,
        p_referencia: input.referencia ?? null,
        p_assunto: input.assunto ?? null,
        p_prazo: input.prazo ?? null,
        p_prioridade: input.prioridade ?? null,
        p_notify_email: input.notifyEmail ?? null,
        p_pinned: input.pinned ?? null,
        p_limpar_prazo: input.limparPrazo ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidateMeuPainel(qc),
  });
}

export function useConcluirItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("meu_item_concluir", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => invalidateMeuPainel(qc),
  });
}

export function useReabrirItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("meu_item_reabrir", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => invalidateMeuPainel(qc),
  });
}

export function useExcluirItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("meu_item_excluir", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => invalidateMeuPainel(qc),
  });
}

// ------------------ Helpers de prazo ------------------

export type PrazoStatus = "vencido" | "hoje" | "em-3-dias" | "futuro" | "sem-prazo";

export function classificarPrazo(prazoISO: string | null): PrazoStatus {
  if (!prazoISO) return "sem-prazo";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(prazoISO + "T00:00:00");
  const diff = Math.round((prazo.getTime() - hoje.getTime()) / 86_400_000);
  if (diff < 0) return "vencido";
  if (diff === 0) return "hoje";
  if (diff <= 3) return "em-3-dias";
  return "futuro";
}

export function adicionarDias(baseISO: string | null, dias: number): string {
  const base = baseISO ? new Date(baseISO + "T00:00:00") : new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + dias);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
