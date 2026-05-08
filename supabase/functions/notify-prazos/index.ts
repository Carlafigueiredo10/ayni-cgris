// Edge function notify-prazos: envia 1 email por dia para o owner
// de cada meu_item com prazo proximo/atrasado e notify_email=TRUE.
//
// Marcos de aviso (dias para o prazo, negativo = atrasado):
//   3, 1, 0, -1, -3, -7
//
// Idempotencia: meus_itens.ultimo_aviso_em garante 1 email/item/dia.
// Disparo: pg_cron diario as 11:00 UTC (08:00 BRT).
//
// Variaveis de ambiente esperadas:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (injetados pelo runtime)
//   NOTIFY_SMTP_HOST, NOTIFY_SMTP_PORT, NOTIFY_SMTP_USER, NOTIFY_SMTP_PASS
//   APP_URL (usado no link do email)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SMTP_HOST = Deno.env.get("NOTIFY_SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = parseInt(Deno.env.get("NOTIFY_SMTP_PORT") || "465", 10);
const SMTP_USER = Deno.env.get("NOTIFY_SMTP_USER")!;
const SMTP_PASS = Deno.env.get("NOTIFY_SMTP_PASS")!;
const APP_URL = Deno.env.get("APP_URL") || "https://ayni-cgris.vercel.app";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MARCOS = [3, 1, 0, -1, -3, -7];

type ItemPrazo = {
  id: string;
  owner_id: string;
  tipo: "PROCESSO" | "TAREFA" | "LEMBRETE";
  referencia: string | null;
  assunto: string;
  prazo: string;          // YYYY-MM-DD
  prioridade: "BAIXA" | "NORMAL" | "ALTA";
  ultima_acao: string | null;
  ultima_acao_em: string | null;
  owner_email: string | null;
  owner_nome: string | null;
};

function diasAteHoje(prazoISO: string): number {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const prazo = new Date(prazoISO + "T00:00:00Z");
  return Math.round((prazo.getTime() - hoje.getTime()) / 86_400_000);
}

function rotuloMarco(diff: number): string {
  if (diff === 0) return "vence hoje";
  if (diff === 1) return "vence amanha";
  if (diff > 0) return `vence em ${diff} dias`;
  if (diff === -1) return "vencido ha 1 dia";
  return `vencido ha ${Math.abs(diff)} dias`;
}

function formatarBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

Deno.serve(async (_req) => {
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("[notify-prazos] SMTP_USER/PASS nao configurados");
    return new Response(JSON.stringify({ error: "SMTP nao configurado" }),
      { status: 500, headers: { "content-type": "application/json" } });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Busca itens elegiveis. Filtra no cliente pelos marcos exatos
  // (evita PL/pgSQL extra; volume baixo).
  const { data: itensRaw, error } = await sb
    .from("meus_itens")
    .select(`
      id, owner_id, tipo, referencia, assunto, prazo, prioridade, ultimo_aviso_em,
      owner:profiles!meus_itens_owner_id_fkey ( email, display_name )
    `)
    .is("deleted_at", null)
    .is("concluido_em", null)
    .eq("notify_email", true)
    .not("prazo", "is", null);

  if (error) {
    console.error("[notify-prazos] erro select itens:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { "content-type": "application/json" } });
  }

  const hojeISO = new Date().toISOString().slice(0, 10);

  // Filtra: marco atingido + ainda nao avisou hoje
  const elegiveis = (itensRaw ?? []).filter((r: Record<string, unknown>) => {
    const diff = diasAteHoje(r.prazo as string);
    if (!MARCOS.includes(diff)) return false;
    if (r.ultimo_aviso_em === hojeISO) return false;
    return true;
  });

  if (elegiveis.length === 0) {
    return new Response(JSON.stringify({ ok: true, enviados: 0, motivo: "nenhum marco hoje" }),
      { headers: { "content-type": "application/json" } });
  }

  // Busca a ultima acao de cada item (1 query agregada)
  const itemIds = elegiveis.map((r) => r.id);
  const { data: acoesRaw } = await sb
    .from("meus_itens_acoes")
    .select("item_id, descricao, created_at")
    .in("item_id", itemIds)
    .order("created_at", { ascending: false });

  const ultimaPorItem = new Map<string, { descricao: string; created_at: string }>();
  for (const a of acoesRaw ?? []) {
    if (!ultimaPorItem.has(a.item_id)) {
      ultimaPorItem.set(a.item_id, { descricao: a.descricao, created_at: a.created_at });
    }
  }

  const itens: ItemPrazo[] = elegiveis.map((r: Record<string, unknown>) => {
    const ultima = ultimaPorItem.get(r.id as string);
    const owner = r.owner as { email?: string | null; display_name?: string | null } | null;
    return {
      id: r.id as string,
      owner_id: r.owner_id as string,
      tipo: r.tipo as ItemPrazo["tipo"],
      referencia: (r.referencia as string | null) ?? null,
      assunto: r.assunto as string,
      prazo: r.prazo as string,
      prioridade: r.prioridade as ItemPrazo["prioridade"],
      ultima_acao: ultima?.descricao ?? null,
      ultima_acao_em: ultima?.created_at ?? null,
      owner_email: owner?.email ?? null,
      owner_nome: owner?.display_name ?? null,
    };
  });

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  });

  let enviados = 0;
  let falhas = 0;

  for (const it of itens) {
    if (!it.owner_email) {
      console.warn("[notify-prazos] sem email para owner", it.owner_id);
      continue;
    }

    const diff = diasAteHoje(it.prazo);
    const status = rotuloMarco(diff);
    const refLinha = it.referencia ? `${it.referencia} — ` : "";
    const ultLinha = it.ultima_acao
      ? `Ultima acao: ${it.ultima_acao}`
      : "Sem acoes registradas ainda.";

    const subject = `[CGRIS] ${it.tipo}: ${refLinha}${it.assunto} — ${status}`;
    const body = `Ola, ${it.owner_nome ?? ""}.

Item do seu Painel ${status}:

  Tipo:       ${it.tipo}
  ${it.referencia ? `Referencia: ${it.referencia}\n  ` : ""}Assunto:    ${it.assunto}
  Prioridade: ${it.prioridade}
  Prazo:      ${formatarBR(it.prazo)}

${ultLinha}

Acesse: ${APP_URL}/meu-painel
`;

    try {
      await client.send({
        from: `CGRIS - Sistema Ayni <${SMTP_USER}>`,
        to: it.owner_email,
        subject,
        content: body,
      });

      const { error: upErr } = await sb
        .from("meus_itens")
        .update({ ultimo_aviso_em: hojeISO })
        .eq("id", it.id);

      if (upErr) {
        console.error("[notify-prazos] erro update ultimo_aviso_em:", upErr);
      }
      enviados++;
    } catch (err) {
      falhas++;
      console.error("[notify-prazos] erro envio item", it.id, err);
    }
  }

  try { await client.close(); } catch { /* noop */ }

  return new Response(JSON.stringify({ ok: true, enviados, falhas, total: itens.length }),
    { headers: { "content-type": "application/json" } });
});
