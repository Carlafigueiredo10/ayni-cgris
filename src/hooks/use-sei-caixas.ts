import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type SeiCaixa = {
  id: string;
  sigla: string;
  nome_sistema: string;
  descricao: string;
  gestor_responsavel: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export function useSeiCaixas(opts: { onlyAtivo?: boolean } = {}) {
  const { onlyAtivo = true } = opts;
  const [caixas, setCaixas] = useState<SeiCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("sei_caixas")
      .select("*")
      .order("ordem", { ascending: true })
      .order("sigla", { ascending: true });

    if (onlyAtivo) query = query.eq("ativo", true);

    const { data, error } = await query;
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setCaixas((data ?? []) as SeiCaixa[]);
    setError(null);
    setLoading(false);
  }, [onlyAtivo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const updateCaixa = useCallback(
    async (
      id: string,
      patch: { descricao?: string; gestor_responsavel?: string }
    ): Promise<boolean> => {
      const { error } = await supabase
        .from("sei_caixas")
        .update(patch)
        .eq("id", id);
      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        return false;
      }
      toast.success("Caixa atualizada");
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  const toggleAtivo = useCallback(
    async (id: string, ativo: boolean): Promise<boolean> => {
      const { error } = await supabase
        .from("sei_caixas")
        .update({ ativo })
        .eq("id", id);
      if (error) {
        toast.error("Erro: " + error.message);
        return false;
      }
      await fetchAll();
      return true;
    },
    [fetchAll]
  );

  return { caixas, loading, error, updateCaixa, toggleAtivo, refresh: fetchAll };
}
