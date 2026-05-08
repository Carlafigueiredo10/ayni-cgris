import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type Team = {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  active: boolean;
};

export type TeamWithSubteams = Team & { subteams: Team[] };

const TEAMS_KEY = ["teams"] as const;

// Lista plana com TODAS as equipes (principais + sub, ativas + inativas).
// UI decide o que filtrar.
export function useTeams() {
  return useQuery({
    queryKey: TEAMS_KEY,
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase.rpc("list_teams");
      if (error) throw error;
      return (data ?? []) as Team[];
    },
    staleTime: 60_000,
  });
}

// Visão hierárquica para selects/listagem com agrupamento.
export function useTeamsHierarchy() {
  const q = useTeams();
  const principais = (q.data ?? []).filter((t) => t.parent_id === null);
  const subteamsByParent = new Map<string, Team[]>();
  for (const t of q.data ?? []) {
    if (t.parent_id) {
      const arr = subteamsByParent.get(t.parent_id) ?? [];
      arr.push(t);
      subteamsByParent.set(t.parent_id, arr);
    }
  }
  const hierarchy: TeamWithSubteams[] = principais.map((p) => ({
    ...p,
    subteams: (subteamsByParent.get(p.id) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  }));
  return { ...q, hierarchy, principais };
}

// ------------------ Mutations ------------------

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: TEAMS_KEY });
}

export function useCriarEquipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; name: string }) => {
      const { data, error } = await supabase.rpc("admin_criar_equipe", {
        p_code: input.code,
        p_name: input.name,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useRenomearEquipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { teamId: string; name: string }) => {
      const { error } = await supabase.rpc("admin_renomear_equipe", {
        p_team_id: input.teamId,
        p_name: input.name,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useSetEquipeActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { teamId: string; active: boolean }) => {
      const { error } = await supabase.rpc("admin_set_equipe_active", {
        p_team_id: input.teamId,
        p_active: input.active,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useCriarSubequipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { parentTeamId: string; name: string }) => {
      const { data, error } = await supabase.rpc("criar_subequipe", {
        p_parent_team_id: input.parentTeamId,
        p_name: input.name,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useRenomearSubequipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subteamId: string; name: string }) => {
      const { error } = await supabase.rpc("renomear_subequipe", {
        p_subteam_id: input.subteamId,
        p_name: input.name,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useInativarSubequipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subteamId: string; active: boolean }) => {
      const { error } = await supabase.rpc("inativar_subequipe", {
        p_subteam_id: input.subteamId,
        p_active: input.active,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useAtribuirSubteam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; subteamId: string | null }) => {
      const { error } = await supabase.rpc("atribuir_subteam", {
        p_user_id: input.userId,
        p_subteam_id: input.subteamId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate(qc);
      qc.invalidateQueries({ queryKey: ["servidores"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
