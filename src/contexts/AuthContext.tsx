import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  team_id: string | null;
  role: "admin_global" | "manager_team" | "member";
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  hasTeam: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isManager: false,
  hasTeam: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log("[Auth] Iniciando...");

    // Safety: se nada resolver em 6s, desbloqueia a UI
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[Auth] Timeout — forçando loading=false");
        setLoading(false);
      }
    }, 6000);

    async function loadProfile(userId: string) {
      console.log("[Auth] Buscando perfil para", userId);
      try {
        // Tenta RPC primeiro (SECURITY DEFINER, bypassa RLS)
        const { data: rpcData, error: rpcErr } = await supabase.rpc("get_my_profile");
        console.log("[Auth] RPC resultado:", { data: rpcData, error: rpcErr });

        if (!mounted) return;

        if (!rpcErr && rpcData && rpcData.length > 0) {
          setProfile(rpcData[0] as Profile);
          return;
        }

        // Fallback: query direta (policy simples: id = auth.uid())
        console.log("[Auth] RPC falhou, tentando query direta...");
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, email, team_id, role")
          .eq("id", userId)
          .single();
        console.log("[Auth] Query direta resultado:", { data, error });

        if (!mounted) return;

        if (error || !data) {
          console.error("[Auth] Perfil nao encontrado:", error);
          setProfile(null);
          return;
        }
        setProfile(data as Profile);
      } catch (err) {
        console.error("[Auth] Erro inesperado:", err);
        if (mounted) setProfile(null);
      }
    }

    async function init() {
      try {
        console.log("[Auth] getSession...");
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("[Auth] getSession resultado:", { session: !!session, error });

        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser.id);
        }
      } catch (err) {
        console.error("[Auth] getSession falhou:", err);
      } finally {
        if (mounted) {
          console.log("[Auth] setLoading(false)");
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[Auth] onAuthStateChange:", _event);
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === "admin_global";
  const isManager = profile?.role === "manager_team";
  const hasTeam = profile?.team_id != null;

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isAdmin, isManager, hasTeam, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
