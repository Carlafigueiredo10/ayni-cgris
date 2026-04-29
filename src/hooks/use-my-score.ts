import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { ScoreRow } from "@/types/registro";

export function useMyScore() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(false);

  const month = format(new Date(), "yyyy-MM-01");

  const fetchScore = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_my_score", {
      p_month: month,
    });
    if (!error && data) {
      setRows(data as ScoreRow[]);
    }
    setLoading(false);
  }, [user, month]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const total = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.pontos), 0),
    [rows]
  );

  const byRegistroId = useMemo(() => {
    const m = new Map<string, ScoreRow>();
    rows.forEach((r) => m.set(r.registro_id, r));
    return m;
  }, [rows]);

  return { rows, total, byRegistroId, loading, refresh: fetchScore };
}
