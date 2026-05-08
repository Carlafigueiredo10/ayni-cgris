import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ServidorRankingRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  siape: string | null;
  team_code: string | null;
  total_processos: number;
  total_concluidos: number;
  total_minutos: number;
  qtd_judicial: number;
  qtd_controle: number;
  qtd_atos: number;
  qtd_reincidencias: number;
};

export function useServidoresRanking(params: {
  month?: string;
  team_code?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { month, team_code, limit = 50, enabled = true } = params;

  const query = useQuery({
    queryKey: ["servidores-ranking", month, team_code, limit],
    enabled,
    queryFn: async (): Promise<ServidorRankingRow[]> => {
      const { data, error } = await supabase.rpc("get_servidores_ranking", {
        p_month: month ?? null,
        p_team_code: team_code ?? null,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as ServidorRankingRow[];
    },
  });

  return {
    rows: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
