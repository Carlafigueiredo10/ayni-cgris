import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

type TeamSummaryRow = {
  mes: string;
  total_processos: number;
  media_minutos: number | null;
  qtd_judicial: number;
  qtd_controle: number;
  qtd_concluidos: number;
  total_minutos: number;
};

export function useCoordinationData() {
  const { hasTeam } = useAuth();
  const [teamSummary, setTeamSummary] = useState<TeamSummaryRow | null>(null);
  const [personalStats, setPersonalStats] = useState({
    total: 0,
    totalMinutos: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);

  const month = format(new Date(), "yyyy-MM-01");

  const fetchTeamSummary = useCallback(async () => {
    if (!hasTeam) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("get_team_summary", {
      p_month: month,
    });

    if (!error && data && data.length > 0) {
      setTeamSummary(data[0] as TeamSummaryRow);
    }
  }, [hasTeam, month]);

  const fetchPersonalStats = useCallback(async () => {
    const { data } = await supabase
      .from("registros")
      .select("minutos")
      .gte("data", month);

    if (data) {
      const total = data.length;
      const totalMinutos = data.reduce(
        (acc: number, r: { minutos: number }) => acc + r.minutos,
        0
      );
      setPersonalStats({
        total,
        totalMinutos,
        media: total > 0 ? Math.round(totalMinutos / total) : 0,
      });
    }
  }, [month]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchTeamSummary(), fetchPersonalStats()]);
      setLoading(false);
    };
    load();
  }, [fetchTeamSummary, fetchPersonalStats]);

  return { teamSummary, personalStats, loading };
}
