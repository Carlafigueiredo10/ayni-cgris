import { useAuth } from "@/contexts/AuthContext";

export default function TeamGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isManagerCgris, hasTeam, loading } = useAuth();

  if (loading) return null;

  if (isAdmin || isManagerCgris) return <>{children}</>;

  if (!hasTeam) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Acesso em configuracao
          </h2>
          <p className="text-muted-foreground">
            Seu acesso esta sendo configurado pela coordenacao. Voce sera
            notificado quando sua equipe for atribuida.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
