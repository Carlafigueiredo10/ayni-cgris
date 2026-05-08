import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Profile } from "@/contexts/AuthContext";

type Team = { id: string; code: string; name: string };

type CreatePayload = {
  email: string;
  display_name?: string;
  role?: "admin_global" | "manager_cgris" | "manager_team" | "member";
  team_code?: string;
  password?: string;
};

type ResetPayload = {
  user_id: string;
  mode: "email" | "set_temp";
  new_password?: string;
};

type UpdateProfilePayload = {
  user_id: string;
  display_name?: string;
  email?: string;
  siape?: string | null;
  regime?: "presencial" | "remoto" | "hibrido" | null;
};

type CreateResult = {
  user_id: string;
  email: string;
  temporary_password: string | null;
};

type ResetResult =
  | { ok: true; mode: "email" }
  | { ok: true; mode: "set_temp"; temporary_password: string };

async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body,
  });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as unknown as { context?: { error?: string } }).context;
      if (ctx?.error) message = ctx.error;
    } catch {
      /* noop */
    }
    throw new Error(message);
  }
  if (data && typeof data === "object" && "error" in (data as object)) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

export function useAdminUsers() {
  const qc = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ["admin-users", "profiles"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase.rpc("list_profiles");
      if (error) throw error;
      return (data as Profile[]) || [];
    },
  });

  const teamsQuery = useQuery({
    queryKey: ["admin-users", "teams"],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, code, name")
        .order("code");
      if (error) throw error;
      return (data as Team[]) || [];
    },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-users", "profiles"] });

  const createUser = useMutation({
    mutationFn: (p: CreatePayload) =>
      invokeAdmin<CreateResult>({ action: "create", ...p }),
    onSuccess: (res) => {
      invalidate();
      if (res.temporary_password) {
        toast.success(`Usuario criado. Senha temporaria: ${res.temporary_password}`, {
          duration: 20000,
        });
      } else {
        toast.success("Usuario criado");
      }
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const inactivate = useMutation({
    mutationFn: (user_id: string) =>
      invokeAdmin<{ ok: true }>({ action: "inactivate", user_id }),
    onSuccess: () => {
      invalidate();
      toast.success("Usuario inativado");
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const reactivate = useMutation({
    mutationFn: (user_id: string) =>
      invokeAdmin<{ ok: true }>({ action: "reactivate", user_id }),
    onSuccess: () => {
      invalidate();
      toast.success("Usuario reativado");
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const resetPassword = useMutation({
    mutationFn: (p: ResetPayload) =>
      invokeAdmin<ResetResult>({ action: "reset_password", ...p }),
    onSuccess: (res) => {
      if (res.mode === "email") {
        toast.success("Email de recuperacao enviado");
      } else {
        toast.success(`Senha temporaria definida: ${res.temporary_password}`, {
          duration: 20000,
        });
      }
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const updateProfile = useMutation({
    mutationFn: (p: UpdateProfilePayload) =>
      invokeAdmin<{ ok: true }>({ action: "update_profile", ...p }),
    onSuccess: () => {
      invalidate();
      toast.success("Perfil atualizado");
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const assignTeam = useMutation({
    mutationFn: async (params: { user_id: string; team_code: string }) => {
      const { error } = await supabase.rpc("assign_team", {
        p_user_id: params.user_id,
        p_team_code: params.team_code,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Equipe atribuida");
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const promoteRole = useMutation({
    mutationFn: async (params: { user_id: string; new_role: string }) => {
      const { error } = await supabase.rpc("promote_role", {
        p_user_id: params.user_id,
        p_new_role: params.new_role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Papel atualizado");
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  return {
    profiles: profilesQuery.data || [],
    teams: teamsQuery.data || [],
    loading: profilesQuery.isLoading || teamsQuery.isLoading,
    refetch: invalidate,
    createUser,
    inactivate,
    reactivate,
    resetPassword,
    updateProfile,
    assignTeam,
    promoteRole,
  };
}
