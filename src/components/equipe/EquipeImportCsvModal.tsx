import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const REQUIRED_COLS = ["nome", "email"] as const;
const OPTIONAL_COLS = ["siape", "regime", "team_code", "ativo"] as const;
const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];

const MAX_FILE_BYTES = 200 * 1024; // 200KB
const MAX_LINES = 1000;

type Row = {
  lineNumber: number;
  nome: string;
  email: string;
  siape: string;
  regime: string;
  team_code: string;
  ativo: boolean;
  errors: string[];
};

type Categorized = {
  novos: Row[];
  atualizados: Array<Row & { servidor_id: string }>;
  invalidos: Row[];
};

type ExistingMap = Map<string, string>; // email lowercase -> servidor.id

function parseCsv(text: string): {
  rows: Row[];
  headerError: string | null;
} {
  // Remover BOM e quebras Windows
  const cleaned = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { rows: [], headerError: "Arquivo vazio" };
  }

  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());

  for (const req of REQUIRED_COLS) {
    if (!header.includes(req)) {
      return {
        rows: [],
        headerError: `Coluna obrigatória ausente: "${req}". Esperado: ${ALL_COLS.join(",")}`,
      };
    }
  }

  const idx: Record<string, number> = {};
  ALL_COLS.forEach((c) => {
    idx[c] = header.indexOf(c);
  });

  const rows: Row[] = [];
  for (let i = 1; i < lines.length && i <= MAX_LINES; i++) {
    const cols = lines[i].split(",").map((s) => s.trim());
    const errors: string[] = [];

    const nome = (cols[idx.nome] ?? "").trim();
    const email = (cols[idx.email] ?? "").trim().toLowerCase();
    const siape = idx.siape >= 0 ? (cols[idx.siape] ?? "").trim() : "";
    const regimeRaw =
      idx.regime >= 0 ? (cols[idx.regime] ?? "").trim().toLowerCase() : "";
    const team_code =
      idx.team_code >= 0
        ? (cols[idx.team_code] ?? "").trim().toLowerCase()
        : "";
    const ativoRaw =
      idx.ativo >= 0 ? (cols[idx.ativo] ?? "").trim().toLowerCase() : "true";

    if (!nome) errors.push("nome obrigatório");

    let regime = "";
    if (regimeRaw && !["presencial", "remoto", "hibrido"].includes(regimeRaw)) {
      errors.push(`regime inválido: "${regimeRaw}"`);
    } else {
      regime = regimeRaw;
    }

    const ativo = !["false", "0", "nao", "não", "inativo"].includes(ativoRaw);

    rows.push({
      lineNumber: i + 1,
      nome,
      email,
      siape,
      regime,
      team_code,
      ativo,
      errors,
    });
  }

  return { rows, headerError: null };
}

function categorize(rows: Row[], existing: ExistingMap): Categorized {
  const novos: Row[] = [];
  const atualizados: Array<Row & { servidor_id: string }> = [];
  const invalidos: Row[] = [];

  for (const r of rows) {
    if (r.errors.length > 0) {
      invalidos.push(r);
      continue;
    }
    const id = r.email ? existing.get(r.email) : undefined;
    if (id) {
      atualizados.push({ ...r, servidor_id: id });
    } else {
      novos.push(r);
    }
  }

  return { novos, atualizados, invalidos };
}

export default function EquipeImportCsvModal({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}) {
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Categorized | null>(null);

  useEffect(() => {
    if (!open) {
      setFilename(null);
      setHeaderError(null);
      setPreview(null);
      setImporting(false);
      setParsing(false);
    }
  }, [open]);

  async function loadExisting(): Promise<ExistingMap> {
    const { data, error } = await supabase
      .from("servidores")
      .select("id, email");
    if (error) {
      toast.error("Erro ao consultar roster: " + error.message);
      return new Map();
    }
    const map = new Map<string, string>();
    (data as { id: string; email: string | null }[]).forEach((s) => {
      if (s.email) map.set(s.email.trim().toLowerCase(), s.id);
    });
    return map;
  }

  const handleFile = async (file: File) => {
    setHeaderError(null);
    setPreview(null);
    setFilename(file.name);

    if (file.size > MAX_FILE_BYTES) {
      setHeaderError(
        `Arquivo grande demais (${Math.round(file.size / 1024)}KB). Máximo ${
          MAX_FILE_BYTES / 1024
        }KB.`
      );
      return;
    }

    setParsing(true);
    try {
      const text = await file.text();
      const { rows, headerError } = parseCsv(text);
      if (headerError) {
        setHeaderError(headerError);
        return;
      }
      const existing = await loadExisting();
      setPreview(categorize(rows, existing));
    } finally {
      setParsing(false);
    }
  };

  const totalAplicar = preview
    ? preview.novos.length + preview.atualizados.length
    : 0;

  const aplicar = async () => {
    if (!preview) return;
    setImporting(true);
    let ok = 0;
    let falhas = 0;

    const tasks: Array<{ row: Row; id: string | null }> = [
      ...preview.novos.map((r) => ({ row: r, id: null as string | null })),
      ...preview.atualizados.map((r) => ({ row: r, id: r.servidor_id })),
    ];

    for (const t of tasks) {
      const { error } = await supabase.rpc("upsert_servidor", {
        p_id: t.id,
        p_nome: t.row.nome,
        p_siape: t.row.siape,
        p_email: t.row.email,
        p_team_code: t.row.team_code,
        p_regime: t.row.regime || null,
        p_ativo: t.row.ativo,
      });
      if (error) {
        console.error(`linha ${t.row.lineNumber}: ${error.message}`);
        falhas++;
      } else {
        ok++;
      }
    }

    setImporting(false);

    if (falhas === 0) {
      toast.success(`Importação concluída: ${ok} registros`);
      onImported();
      onOpenChange(false);
    } else {
      toast.warning(
        `Importação parcial: ${ok} ok, ${falhas} falhas (veja console)`
      );
      onImported();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar servidores via CSV</DialogTitle>
          <DialogDescription>
            Formato esperado:{" "}
            <code className="text-[11px]">{ALL_COLS.join(",")}</code>. Apenas{" "}
            <code className="text-[11px]">nome</code> e{" "}
            <code className="text-[11px]">email</code> são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            disabled={importing}
            className="text-sm"
          />

          {filename && (
            <p className="text-xs text-muted-foreground">
              Arquivo: <span className="font-medium">{filename}</span>
            </p>
          )}

          {parsing && (
            <p className="text-sm text-muted-foreground">Lendo arquivo...</p>
          )}

          {headerError && (
            <p className="text-sm text-destructive">{headerError}</p>
          )}

          {preview && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                <span className="font-medium">{preview.novos.length}</span>{" "}
                novos
              </p>
              <p>
                <span className="font-medium">
                  {preview.atualizados.length}
                </span>{" "}
                atualizados
              </p>
              <p>
                <span className="font-medium">{preview.invalidos.length}</span>{" "}
                inválidos
                {preview.invalidos.length > 0 && (
                  <span className="text-muted-foreground">
                    {" "}
                    (serão ignorados)
                  </span>
                )}
              </p>

              {preview.invalidos.length > 0 && (
                <details className="pt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Ver problemas
                  </summary>
                  <ul className="text-xs mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {preview.invalidos.slice(0, 50).map((r) => (
                      <li key={r.lineNumber}>
                        Linha {r.lineNumber}: {r.errors.join("; ")}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancelar
          </Button>
          <Button
            onClick={aplicar}
            disabled={!preview || totalAplicar === 0 || importing}
          >
            {importing
              ? "Importando..."
              : `Importar ${totalAplicar} registros`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
