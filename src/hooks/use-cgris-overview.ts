import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export type CgrisEquipeBreakdown = {
  team_id: string;
  code: string;
  name: string;
  processos: number;
  servidores: number;
  visivel: boolean;        // false quando < 3 servidores no mês (privacidade)
};

export type CgrisOverview = {
  mes: string;
  total_servidores_no_mes: number;
  total_servidores_cadastrados: number;
  total_processos: number;
  total_concluidos: number;
  total_minutos: number;
  qtd_judicial: number;
  qtd_controle: number;
  qtd_atos: number;
  qtd_reincidencias: number;
  taxa_reincidencia_pct: number | null;
  processos_por_equipe: CgrisEquipeBreakdown[];
};

export type CgrisMonthlyHistoryRow = {
  mes: string;
  total_processos: number;
  total_concluidos: number;
  qtd_reincidencias: number;
};

export function useCgrisOverview(month?: string) {
  const targetMonth = month ?? format(new Date(), "yyyy-MM-01");

  const overviewQuery = useQuery({
    queryKey: ["cgris-overview", targetMonth],
    queryFn: async (): Promise<CgrisOverview | null> => {
      const { data, error } = await supabase.rpc("get_cgris_overview", {
        p_month: targetMonth,
      });
      if (error) throw error;
      return (data && data.length > 0 ? data[0] : null) as CgrisOverview | null;
    },
  });

  const historyQuery = useQuery({
    queryKey: ["cgris-monthly-history", 6],
    queryFn: async (): Promise<CgrisMonthlyHistoryRow[]> => {
      const { data, error } = await supabase.rpc("get_cgris_monthly_history", {
        p_months: 6,
      });
      if (error) throw error;
      return (data ?? []) as CgrisMonthlyHistoryRow[];
    },
  });

  return {
    overview: overviewQuery.data ?? null,
    history: historyQuery.data ?? [],
    loading: overviewQuery.isLoading || historyQuery.isLoading,
    error: overviewQuery.error || historyQuery.error,
  };
}
