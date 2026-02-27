import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type TeamReportRow = {
  team_id: string;
  team_code: string;
  team_name: string;
  mes: string;
  total_processos: number;
  servidores_ativos: number;
  media_minutos_processo: number | null;
  total_minutos: number;
  media_minutos_judicial: number | null;
  media_minutos_controle: number | null;
  qtd_judicial: number;
  qtd_controle: number;
  qtd_reincidencias: number;
  taxa_reincidencia_pct: number | null;
};

export function useTeamReport() {
  const [rows, setRows] = useState<TeamReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(
    async (teamCode?: string, month?: string) => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_team_report", {
        p_team_code: teamCode || null,
        p_month: month || null,
      });

      if (error) {
        toast.error("Erro ao carregar relatorio: " + error.message);
        setLoading(false);
        return;
      }

      setRows((data as TeamReportRow[]) || []);
      setLoading(false);
    },
    []
  );

  return { rows, loading, fetchReport };
}
