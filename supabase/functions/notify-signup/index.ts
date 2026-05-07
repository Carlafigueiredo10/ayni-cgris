import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SMTP_HOST = Deno.env.get("NOTIFY_SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = parseInt(Deno.env.get("NOTIFY_SMTP_PORT") || "465", 10);
const SMTP_USER = Deno.env.get("NOTIFY_SMTP_USER")!;
const SMTP_PASS = Deno.env.get("NOTIFY_SMTP_PASS")!;
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") || SMTP_USER;
const APP_URL = Deno.env.get("APP_URL") || "https://ayni-cgris.vercel.app";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON invalido" }), {
      status: 400,
    });
  }

  // Webhook do Supabase manda { type, table, record, schema, ... }
  // Mas tambem aceitamos chamada direta com { record: {...} }
  const record = (body.record ?? body) as Record<string, unknown>;
  const email = record?.email as string | undefined;
  const display_name = (record?.display_name as string | undefined) || "(sem nome)";
  const id = record?.id as string | undefined;

  if (!email) {
    return new Response(JSON.stringify({ ok: true, skipped: "no email" }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (!SMTP_USER || !SMTP_PASS) {
    console.error("[notify-signup] SMTP_USER/PASS nao configurados");
    return new Response(
      JSON.stringify({ error: "SMTP nao configurado nos secrets" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const when = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const client = new SMTPClient({
    connection: {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      tls: true,
      auth: { username: SMTP_USER, password: SMTP_PASS },
    },
  });

  try {
    await client.send({
      from: `CGRIS - Sistema Ayni <${SMTP_USER}>`,
      to: NOTIFY_TO,
      subject: `[CGRIS] Novo cadastro: ${email}`,
      content: `Novo cadastro registrado no Sistema Ayni.

Nome:   ${display_name}
Email:  ${email}
Quando: ${when}
ID:     ${id ?? "-"}

Acesse ${APP_URL}/admin para gerenciar (atribuir equipe, papel ou inativar).
`,
    });
  } catch (err) {
    console.error("[notify-signup] erro ao enviar:", err);
    try {
      await client.close();
    } catch {
      /* noop */
    }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  await client.close();

  return new Response(JSON.stringify({ ok: true, sent_to: NOTIFY_TO }), {
    headers: { "content-type": "application/json" },
  });
});
