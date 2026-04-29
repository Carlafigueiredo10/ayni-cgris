import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type Servidor = {
  id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
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
  teams: { code: string; name: string } | null;
};

export function useServidores() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchServidores() {
      const { data, error } = await supabase
        .from("servidores")
        .select(
          "id, nome, siape, email, team_id, presencial, ativo, teams(code, name)"
        )
        .eq("ativo", true)
        .order("nome");

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const mapped: Servidor[] = (data as unknown as ServidorRow[]).map((s) => ({
        id: s.id,
        nome: s.nome,
        siape: s.siape,
        email: s.email,
        team_id: s.team_id,
        team_code: s.teams?.code ?? null,
        team_name: s.teams?.name ?? null,
        presencial: s.presencial,
        ativo: s.ativo,
      }));

      setServidores(mapped);
      setLoading(false);
    }

    fetchServidores();

    return () => {
      mounted = false;
    };
  }, []);

  return { servidores, loading, error };
}
