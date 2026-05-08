import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Regime } from "@/contexts/AuthContext";
import type { ServidorInput } from "@/hooks/use-servidores";

export type { ServidorInput };

export type ServidorAdmin = {
  id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  team_code: string | null;
  subteam_id: string | null;
  subteam_code: string | null;
  subteam_name: string | null;
  regime: Regime | null;
  ativo: boolean;
};

type ServidorRow = {
  id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  subteam_id: string | null;
  regime: Regime | null;
  ativo: boolean;
  teams: { code: string } | null;
  subteam: { code: string; name: string } | null;
};

export function useServidoresAdmin() {
  const [servidores, setServidores] = useState<ServidorAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servidores")
      .select(
        "id, nome, siape, email, team_id, subteam_id, regime, ativo, teams!servidores_team_id_fkey(code), subteam:teams!servidores_subteam_id_fkey(code, name)"
      )
      .order("nome");

    if (error) {
      toast.error("Erro ao carregar servidores: " + error.message);
      setLoading(false);
      return;
    }

    const mapped: ServidorAdmin[] = (data as unknown as ServidorRow[]).map((s) => ({
      id: s.id,
      nome: s.nome,
      siape: s.siape,
      email: s.email,
      team_id: s.team_id,
      team_code: s.teams?.code ?? null,
      subteam_id: s.subteam_id,
      subteam_code: s.subteam?.code ?? null,
      subteam_name: s.subteam?.name ?? null,
      regime: s.regime,
      ativo: s.ativo,
    }));

    setServidores(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const save = useCallback(
    async (input: ServidorInput) => {
      const { data: novoId, error } = await supabase.rpc("upsert_servidor", {
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

      const servidorId = (novoId as string | null) ?? input.id ?? null;

      if (servidorId && input.subteam_id !== undefined) {
        const { error: subErr } = await supabase.rpc("atribuir_subteam_servidor", {
          p_servidor_id: servidorId,
          p_subteam_id: input.subteam_id,
        });
        if (subErr) {
          toast.error("Servidor salvo, mas falhou sub-equipe: " + subErr.message);
        }
      }

      toast.success(input.id ? "Servidor atualizado" : "Servidor adicionado");
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  return { servidores, loading, save, refresh: fetchAll };
}
