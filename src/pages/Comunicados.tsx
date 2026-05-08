import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useComunicados,
  formatNumeroComunicado,
} from "@/hooks/use-comunicados";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Megaphone, ExternalLink, Search, Settings } from "lucide-react";

export default function Comunicados() {
  const { isAdmin } = useAuth();
  const { comunicados, loading } = useComunicados();
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return comunicados;
    return comunicados.filter((c) => {
      return (
        c.titulo.toLowerCase().includes(q) ||
        c.resumo.toLowerCase().includes(q) ||
        formatNumeroComunicado(c).toLowerCase().includes(q)
      );
    });
  }, [comunicados, busca]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Megaphone className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Comunicados</h1>
            <p className="text-sm text-muted-foreground">
              Comunicados oficiais publicados pela CGRIS
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/comunicados">
              <Settings className="mr-1.5 h-4 w-4" />
              Gerenciar
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por número, título ou resumo..."
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground text-sm py-8 text-center">
          Carregando...
        </p>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {comunicados.length === 0
              ? "Nenhum comunicado publicado ainda."
              : "Nenhum comunicado corresponde à busca."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary">
                      {formatNumeroComunicado(c)}
                    </p>
                    <CardTitle className="text-base mt-1">{c.titulo}</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(c.data_publicacao)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.resumo}
                </p>
                <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">
                    {c.autor_setor}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={c.drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      Abrir no Drive
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  // iso vem como YYYY-MM-DD
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
