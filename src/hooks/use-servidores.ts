import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Regime } from "@/contexts/AuthContext";

export type Servidor = {
  id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
  regime: Regime | null;
  ativo: boolean;
  profile_id: string | null;
  usuario_ativo: boolean;
};

export type ServidorInput = {
  id?: string | null;
  nome: string;
  siape: string;
  email: string;
  team_code: string;
  regime: Regime | "";
  ativo: boolean;
};

type EquipeViewRow = {
  servidor_id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
  regime: Regime | null;
  ativo: boolean;
  profile_id: string | null;
  usuario_ativo: boolean;
};

export function useServidores() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipe_view")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const mapped: Servidor[] = (data as EquipeViewRow[]).map((s) => ({
      id: s.servidor_id,
      nome: s.nome,
      siape: s.siape,
      email: s.email,
      team_id: s.team_id,
      team_code: s.team_code,
      team_name: s.team_name,
      regime: s.regime,
      ativo: s.ativo,
      profile_id: s.profile_id,
      usuario_ativo: s.usuario_ativo,
    }));

    setServidores(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const save = useCallback(
    async (input: ServidorInput): Promise<boolean> => {
      const { error } = await supabase.rpc("upsert_servidor", {
        p_id: input.id ?? null,
        p_nome: input.nome,
        p_siape: input.siape,
        p_email: input.email,
        p_team_code: input.team_code,
        p_regime: input.regime || null,
        p_ativo: input.ativo,
      });

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        return false;
      }

      toast.success(input.id ? "Servidor atualizado" : "Servidor adicionado");
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  return { servidores, loading, error, save, refresh: fetchAll };
}
