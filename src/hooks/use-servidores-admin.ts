import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type ServidorAdmin = {
  id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  team_code: string | null;
  presencial: boolean;
  ativo: boolean;
};

export type ServidorInput = {
  id?: string | null;
  nome: string;
  siape: string;
  email: string;
  team_code: string;
  presencial: boolean;
  ativo: boolean;
};

type ServidorRow = {
  id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  presencial: boolean;
  ativo: boolean;
  teams: { code: string } | null;
};

export function useServidoresAdmin() {
  const [servidores, setServidores] = useState<ServidorAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("servidores")
      .select("id, nome, siape, email, team_id, presencial, ativo, teams(code)")
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
      presencial: s.presencial,
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
      const { error } = await supabase.rpc("upsert_servidor", {
        p_id: input.id ?? null,
        p_nome: input.nome,
        p_siape: input.siape,
        p_email: input.email,
        p_team_code: input.team_code,
        p_presencial: input.presencial,
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

  return { servidores, loading, save, refresh: fetchAll };
}
