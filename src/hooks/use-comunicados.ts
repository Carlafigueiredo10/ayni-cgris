import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type Comunicado = {
  id: string;
  numero: number;
  ano: number;
  titulo: string;
  resumo: string;
  drive_url: string;
  data_publicacao: string;
  autor_setor: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ComunicadoInput = {
  id?: string | null;
  numero: number;
  ano: number;
  titulo: string;
  resumo: string;
  drive_url: string;
  data_publicacao: string;
  autor_setor?: string;
};

const DEFAULT_AUTOR = "Produtividade, Dados e Comunicação/CGRIS";

export function formatNumeroComunicado(c: Pick<Comunicado, "numero" | "ano">) {
  return `Comunicado CGRIS nº ${String(c.numero).padStart(2, "0")}/${c.ano}`;
}

export function useComunicados(opts: { limit?: number } = {}) {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("comunicados")
      .select("*")
      .order("ano", { ascending: false })
      .order("numero", { ascending: false });

    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setComunicados((data ?? []) as Comunicado[]);
    setError(null);
    setLoading(false);
  }, [opts.limit]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const save = useCallback(
    async (input: ComunicadoInput): Promise<boolean> => {
      const payload = {
        numero: input.numero,
        ano: input.ano,
        titulo: input.titulo.trim(),
        resumo: input.resumo.trim(),
        drive_url: input.drive_url.trim(),
        data_publicacao: input.data_publicacao,
        autor_setor: (input.autor_setor || DEFAULT_AUTOR).trim(),
      };

      if (input.id) {
        const { error } = await supabase
          .from("comunicados")
          .update(payload)
          .eq("id", input.id);
        if (error) {
          toast.error("Erro ao atualizar: " + error.message);
          return false;
        }
        toast.success("Comunicado atualizado");
      } else {
        const { data: userRes } = await supabase.auth.getUser();
        const { error } = await supabase.from("comunicados").insert({
          ...payload,
          created_by: userRes.user?.id ?? null,
        });
        if (error) {
          if (error.code === "23505") {
            toast.error(
              `Já existe Comunicado nº ${input.numero}/${input.ano}`
            );
          } else {
            toast.error("Erro ao criar: " + error.message);
          }
          return false;
        }
        toast.success("Comunicado criado");
      }
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("comunicados").delete().eq("id", id);
      if (error) {
        toast.error("Erro ao excluir: " + error.message);
        return false;
      }
      toast.success("Comunicado excluído");
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  return { comunicados, loading, error, save, remove, refresh: fetchAll };
}
