import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type FeriasStatus = "PENDENTE" | "APROVADA" | "AJUSTAR" | "CANCELADA";

export type Ferias = {
  id: string;
  servidor_id: string;
  data_inicio: string;
  data_fim: string;
  status: FeriasStatus;
  observacao_servidor: string | null;
  observacao_gestor: string | null;
  created_at: string;
  updated_at: string;
};

const FERIAS_COLS =
  "id, servidor_id, data_inicio, data_fim, status, observacao_servidor, observacao_gestor, created_at, updated_at";

export function useMinhasFerias() {
  const query = useQuery({
    queryKey: ["ferias", "minhas"],
    queryFn: async (): Promise<Ferias[]> => {
      // RLS expoe automaticamente apenas as ferias do proprio usuario.
      const { data, error } = await supabase
        .from("ferias")
        .select(FERIAS_COLS)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ferias[];
    },
  });

  return {
    ferias: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSolicitarFerias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dataInicio: string;
      dataFim: string;
      observacao?: string | null;
      servidorId?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("solicitar_ferias", {
        p_servidor_id: input.servidorId ?? null,
        p_data_inicio: input.dataInicio,
        p_data_fim: input.dataFim,
        p_observacao: input.observacao ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ferias"] }),
  });
}

export function useAtualizarFerias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      dataInicio: string;
      dataFim: string;
      observacao?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("atualizar_ferias", {
        p_id: input.id,
        p_data_inicio: input.dataInicio,
        p_data_fim: input.dataFim,
        p_observacao: input.observacao ?? null,
      });
      if (error) throw error;
      return data as FeriasStatus;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ferias"] }),
  });
}

export function useAlterarStatusFerias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      status: FeriasStatus;
      observacaoGestor?: string | null;
    }) => {
      const { data, error } = await supabase.rpc("alterar_status_ferias", {
        p_id: input.id,
        p_status: input.status,
        p_observacao_gestor: input.observacaoGestor ?? null,
      });
      if (error) throw error;
      return data as FeriasStatus;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ferias"] }),
  });
}

export function useExcluirFerias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("excluir_ferias", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ferias"] }),
  });
}
