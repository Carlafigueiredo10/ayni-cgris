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
  profile_id: string | null;
  usuario_ativo: boolean;
};

type EquipeViewRow = {
  servidor_id: string;
  nome: string;
  siape: string | null;
  email: string | null;
  team_id: string | null;
  team_code: string | null;
  team_name: string | null;
  presencial: boolean;
  ativo: boolean;
  profile_id: string | null;
  usuario_ativo: boolean;
};

export function useServidores() {
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchServidores() {
      const { data, error } = await supabase
        .from("equipe_view")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (!mounted) return;

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
        presencial: s.presencial,
        ativo: s.ativo,
        profile_id: s.profile_id,
        usuario_ativo: s.usuario_ativo,
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
