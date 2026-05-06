import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  team_id: string | null;
  role: "admin_global" | "manager_cgris" | "manager_team" | "member";
  is_active: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isManagerCgris: boolean;
  isManager: boolean;
  hasTeam: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isManagerCgris: false,
  isManager: false,
  hasTeam: false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Carrega o profile com timeout duro — nunca pendura.
async function loadProfileSafe(userId: string): Promise<Profile | null> {
  const TIMEOUT_MS = 4000;

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("get_my_profile");
      if (!rpcErr && rpcData && rpcData.length > 0) {
        return rpcData[0] as Profile;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email, team_id, role, is_active")
        .eq("id", userId)
        .single();
      if (error || !data) return null;
      return data as Profile;
    } catch (err) {
      console.error("[Auth] loadProfile erro:", err);
      return null;
    }
  };

  return Promise.race([
    fetchProfile(),
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.warn("[Auth] loadProfile timeout");
        resolve(null);
      }, TIMEOUT_MS)
    ),
  ]);
}

function clearSupabaseStorage() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("sb-"))
      .forEach((k) => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch {
    /* noop */
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fallback extremo: se bootstrap não terminar em 10s, registra erro e libera UI.
    const fallback = setTimeout(() => {
      if (mounted && loading) {
        console.error("[Auth] bootstrap timeout — sem sessão resolvida em 10s");
        setLoading(false);
      }
    }, 10000);

    async function bootstrap() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error("[Auth] getSession erro:", error);

        if (!mounted) return;

        const u = session?.user ?? null;
        setUser(u);

        if (u) {
          const p = await loadProfileSafe(u.id);
          if (mounted) setProfile(p);
        }
      } catch (err) {
        console.error("[Auth] bootstrap exceção:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(fallback);
        }
      }
    }

    bootstrap();

    // Listener apenas sincroniza mudanças futuras. Bootstrap já tratou estado inicial.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === "INITIAL_SESSION") return;

      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        const p = await loadProfileSafe(u.id);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.error("[Auth] signOut error:", err);
    } finally {
      clearSupabaseStorage();
      setUser(null);
      setProfile(null);
      window.location.replace("/login");
    }
  };

  const isAdmin = profile?.role === "admin_global";
  const isManagerCgris = profile?.role === "manager_cgris";
  const isManager = profile?.role === "manager_team";
  const hasTeam = profile?.team_id != null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isManagerCgris,
        isManager,
        hasTeam,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
