import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Team = { id: string; code: string; name: string };

export function useAdmin() {
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    const { data } = await supabase
      .from("teams")
      .select("id, code, name")
      .order("code");
    setTeams((data as Team[]) || []);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc("list_profiles");
    if (error) {
      console.error("Erro ao listar perfis:", error);
      setPendingUsers([]);
      setTeamMembers([]);
      return;
    }
    const all = (data as Profile[]) || [];
    setPendingUsers(all.filter((p) => p.team_id == null));
    setTeamMembers(all.filter((p) => p.team_id != null));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTeams(), fetchUsers()]);
    setLoading(false);
  }, [fetchTeams, fetchUsers]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const assignTeam = useCallback(
    async (userId: string, teamCode: string) => {
      const { error } = await supabase.rpc("assign_team", {
        p_user_id: userId,
        p_team_code: teamCode,
      });
      if (error) {
        toast.error("Erro ao atribuir equipe: " + error.message);
        return false;
      }
      toast.success("Equipe atribuida!");
      await refresh();
      return true;
    },
    [refresh]
  );

  const promoteRole = useCallback(
    async (userId: string, newRole: string) => {
      const { error } = await supabase.rpc("promote_role", {
        p_user_id: userId,
        p_new_role: newRole,
      });
      if (error) {
        toast.error("Erro ao alterar papel: " + error.message);
        return false;
      }
      toast.success("Papel alterado!");
      await refresh();
      return true;
    },
    [refresh]
  );

  const teamName = (teamId: string | null) =>
    teams.find((t) => t.id === teamId)?.code?.toUpperCase() || "-";

  return {
    pendingUsers,
    teamMembers,
    teams,
    loading,
    assignTeam,
    promoteRole,
    teamName,
    refresh,
  };
}
