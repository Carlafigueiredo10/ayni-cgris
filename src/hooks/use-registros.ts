import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Registro, RegistroDB, ReincidenciaResult } from "@/types/registro";
import { toast } from "sonner";

function dbToRegistro(r: RegistroDB): Registro {
  return {
    id: r.id,
    user_id: r.user_id,
    servidor: r.servidor ?? undefined,
    data: r.data,
    processo: r.processo,
    status: r.status as Registro["status"],
    minutos: r.minutos,
    documentoOuAcao: r.documento_ou_acao ?? undefined,
    sistemaAjuste: r.sistema_ajuste ?? undefined,
    tipoNatureza: r.tipo_natureza ?? undefined,
    tipoProcesso: r.tipo_processo ?? undefined,
    tipoControle: r.tipo_controle ?? undefined,
    motivoTempo: r.motivo_tempo ?? undefined,
    numPaginas: r.num_paginas ?? undefined,
    assunto: r.assunto ?? undefined,
    familiaridade: r.familiaridade ?? undefined,
    outroMotivo: r.outro_motivo ?? undefined,
    reincidenciaTipo:
      (r.reincidencia_tipo as Registro["reincidenciaTipo"]) ?? "none",
    reincidenciaRespostas: r.reincidencia_respostas ?? undefined,
  };
}

export function useRegistros() {
  const { user, profile } = useAuth();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRegistros = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("registros")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar registros:", error);
      setLoading(false);
      return;
    }

    setRegistros((data as RegistroDB[]).map(dbToRegistro));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRegistros();
  }, [fetchRegistros]);

  const checkReincidence = useCallback(
    async (processo: string): Promise<ReincidenciaResult | null> => {
      const { data, error } = await supabase.rpc("check_reincidence", {
        p_processo: processo,
      });
      if (error) {
        console.error("Erro ao verificar reincidencia:", error);
        return null;
      }
      return data?.[0] ?? null;
    },
    []
  );

  const addRegistro = useCallback(
    async (
      novo: Registro,
      reincidenciaTipo: string = "none",
      reincidenciaRespostas: Record<string, unknown> | null = null
    ) => {
      if (!user) return false;

      const { error } = await supabase.from("registros").insert({
        user_id: user.id,
        servidor: profile?.display_name ?? user.email,
        data: novo.data,
        processo: novo.processo,
        status: novo.status,
        minutos: novo.minutos,
        documento_ou_acao: novo.documentoOuAcao,
        sistema_ajuste: novo.sistemaAjuste,
        tipo_natureza: novo.tipoNatureza,
        tipo_processo: novo.tipoProcesso,
        tipo_controle: novo.tipoControle,
        motivo_tempo: novo.motivoTempo,
        num_paginas: novo.numPaginas,
        assunto: novo.assunto,
        familiaridade: novo.familiaridade,
        outro_motivo: novo.outroMotivo,
        reincidencia_tipo: reincidenciaTipo,
        reincidencia_respostas: reincidenciaRespostas,
      });

      if (error) {
        toast.error("Erro ao salvar registro: " + error.message);
        return false;
      }

      toast.success("Registro salvo!");
      await fetchRegistros();
      return true;
    },
    [user, profile, fetchRegistros]
  );

  const stats = useMemo(() => {
    const total = registros.length;
    const totalMinutos = registros.reduce((acc, r) => acc + r.minutos, 0);
    const media = total > 0 ? Math.round(totalMinutos / total) : 0;
    return { total, totalMinutos, media };
  }, [registros]);

  return {
    registros,
    loading,
    stats,
    fetchRegistros,
    checkReincidence,
    addRegistro,
  };
}
