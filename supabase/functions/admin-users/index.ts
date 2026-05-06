import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BAN_TARGET_ISO = "2100-01-01T00:00:00Z";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function genTempPassword(len = 12): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => alphabet[b % alphabet.length]).join("");
}

function banDurationUntil(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const hours = Math.max(1, Math.ceil((target - now) / (1000 * 60 * 60)));
  return `${hours}h`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  // 1. Validar JWT e obter caller
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: "Token invalido" }, 401);
  }
  const callerId = userData.user.id;

  // 2. Service-role client + checagem de admin_global
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: callerProfile, error: callerErr } = await admin
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", callerId)
    .single();

  if (callerErr || !callerProfile) {
    return jsonResponse({ error: "Perfil nao encontrado" }, 403);
  }
  if (callerProfile.role !== "admin_global" || !callerProfile.is_active) {
    return jsonResponse({ error: "Acesso restrito a admin_global" }, 403);
  }

  // 3. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON invalido" }, 400);
  }
  const action = body.action as string | undefined;
  if (!action) {
    return jsonResponse({ error: "action obrigatoria" }, 400);
  }

  // Helper: audit log (sem segredos)
  async function logAction(
    targetId: string | null,
    a: string,
    payload: Record<string, unknown>,
  ) {
    await admin.from("admin_audit_logs").insert({
      admin_user_id: callerId,
      target_user_id: targetId,
      action: a,
      payload,
    });
  }

  // Helper: bloqueia operações destrutivas em outro admin_global
  async function assertNotProtectedAdmin(targetUserId: string) {
    const { data: t } = await admin
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .single();
    if (t?.role === "admin_global" && targetUserId !== callerId) {
      return "Operacao nao permitida em outro admin_global";
    }
    return null;
  }

  try {
    switch (action) {
      // ------------------------------------------------------------
      // CREATE
      // ------------------------------------------------------------
      case "create": {
        const email = (body.email as string | undefined)?.trim().toLowerCase();
        const display_name = body.display_name as string | undefined;
        const role = body.role as string | undefined;
        const team_code = body.team_code as string | undefined;
        const passwordIn = body.password as string | undefined;

        if (!email) return jsonResponse({ error: "email obrigatorio" }, 400);
        if (
          role &&
          !["admin_global", "manager_cgris", "manager_team", "member"].includes(
            role,
          )
        ) {
          return jsonResponse({ error: "role invalido" }, 400);
        }

        const finalPassword = passwordIn && passwordIn.length >= 8
          ? passwordIn
          : genTempPassword();

        const { data: created, error: createErr } = await admin.auth.admin
          .createUser({
            email,
            password: finalPassword,
            email_confirm: true,
            user_metadata: { nome: display_name || email },
          });
        if (createErr || !created.user) {
          return jsonResponse(
            { error: createErr?.message || "Falha ao criar usuario" },
            400,
          );
        }
        const newUserId = created.user.id;

        // Trigger handle_new_user já criou profile com role='member'.
        // Aplicar role/team_code/display_name conforme payload.
        const updates: Record<string, unknown> = {};
        if (display_name) updates.display_name = display_name;
        if (role && role !== "member") updates.role = role;
        if (team_code) {
          const { data: team } = await admin
            .from("teams")
            .select("id")
            .eq("code", team_code)
            .single();
          if (team) updates.team_id = team.id;
        }
        if (Object.keys(updates).length > 0) {
          await admin.from("profiles").update(updates).eq("id", newUserId);
        }

        await logAction(newUserId, "create", {
          email,
          display_name,
          role,
          team_code,
          password_provided_by_admin: !!passwordIn,
        });

        return jsonResponse({
          user_id: newUserId,
          email,
          temporary_password: passwordIn ? null : finalPassword,
        });
      }

      // ------------------------------------------------------------
      // INACTIVATE
      // ------------------------------------------------------------
      case "inactivate": {
        const user_id = body.user_id as string | undefined;
        if (!user_id) {
          return jsonResponse({ error: "user_id obrigatorio" }, 400);
        }

        const guard = await assertNotProtectedAdmin(user_id);
        if (guard) return jsonResponse({ error: guard }, 403);

        const ban = banDurationUntil(BAN_TARGET_ISO);
        const { error: banErr } = await admin.auth.admin.updateUserById(
          user_id,
          { ban_duration: ban } as never,
        );
        if (banErr) return jsonResponse({ error: banErr.message }, 400);

        await admin.from("profiles").update({ is_active: false }).eq(
          "id",
          user_id,
        );

        await logAction(user_id, "inactivate", { ban_target: BAN_TARGET_ISO });

        return jsonResponse({ ok: true });
      }

      // ------------------------------------------------------------
      // REACTIVATE
      // ------------------------------------------------------------
      case "reactivate": {
        const user_id = body.user_id as string | undefined;
        if (!user_id) {
          return jsonResponse({ error: "user_id obrigatorio" }, 400);
        }

        const { error: banErr } = await admin.auth.admin.updateUserById(
          user_id,
          { ban_duration: "none" } as never,
        );
        if (banErr) return jsonResponse({ error: banErr.message }, 400);

        await admin.from("profiles").update({ is_active: true }).eq(
          "id",
          user_id,
        );

        await logAction(user_id, "reactivate", {});

        return jsonResponse({ ok: true });
      }

      // ------------------------------------------------------------
      // RESET_PASSWORD
      // ------------------------------------------------------------
      case "reset_password": {
        const user_id = body.user_id as string | undefined;
        const mode = body.mode as string | undefined;
        const new_password = body.new_password as string | undefined;
        if (!user_id) {
          return jsonResponse({ error: "user_id obrigatorio" }, 400);
        }
        if (!mode || !["email", "set_temp"].includes(mode)) {
          return jsonResponse(
            { error: "mode deve ser 'email' ou 'set_temp'" },
            400,
          );
        }

        // Buscar email do alvo
        const { data: tgt, error: tgtErr } = await admin
          .from("profiles")
          .select("email, role")
          .eq("id", user_id)
          .single();
        if (tgtErr || !tgt) {
          return jsonResponse({ error: "Usuario nao encontrado" }, 404);
        }
        // Guarda: nao trocar senha de outro admin_global
        if (tgt.role === "admin_global" && user_id !== callerId) {
          return jsonResponse(
            { error: "Operacao nao permitida em outro admin_global" },
            403,
          );
        }

        if (mode === "email") {
          // Envia email de reset usando o flow padrao
          const { error: linkErr } = await admin.auth.admin.generateLink({
            type: "recovery",
            email: tgt.email!,
          });
          if (linkErr) {
            return jsonResponse({ error: linkErr.message }, 400);
          }
          await logAction(user_id, "reset_password", { mode: "email" });
          return jsonResponse({ ok: true, mode: "email" });
        }

        // mode === 'set_temp'
        const finalPassword =
          new_password && new_password.length >= 8
            ? new_password
            : genTempPassword();

        const { error: updErr } = await admin.auth.admin.updateUserById(
          user_id,
          { password: finalPassword },
        );
        if (updErr) return jsonResponse({ error: updErr.message }, 400);

        await logAction(user_id, "reset_password", {
          mode: "set_temp",
          password_provided_by_admin: !!new_password,
        });

        return jsonResponse({
          ok: true,
          mode: "set_temp",
          temporary_password: finalPassword,
        });
      }

      // ------------------------------------------------------------
      // UPDATE_PROFILE
      // ------------------------------------------------------------
      case "update_profile": {
        const user_id = body.user_id as string | undefined;
        const display_name = body.display_name as string | undefined;
        const email = (body.email as string | undefined)?.trim().toLowerCase();
        if (!user_id) {
          return jsonResponse({ error: "user_id obrigatorio" }, 400);
        }
        if (!display_name && !email) {
          return jsonResponse(
            { error: "Nada a atualizar (display_name ou email)" },
            400,
          );
        }

        const { data: tgt } = await admin
          .from("profiles")
          .select("role")
          .eq("id", user_id)
          .single();

        const isProtectedAdmin =
          tgt?.role === "admin_global" && user_id !== callerId;

        // Para outro admin_global: só permite display_name
        if (isProtectedAdmin && email) {
          return jsonResponse(
            { error: "Email de outro admin_global nao pode ser alterado" },
            403,
          );
        }

        const profileUpdates: Record<string, unknown> = {};
        if (display_name) profileUpdates.display_name = display_name;
        if (email) profileUpdates.email = email;

        if (email) {
          const { error: e } = await admin.auth.admin.updateUserById(user_id, {
            email,
            email_confirm: true,
          });
          if (e) return jsonResponse({ error: e.message }, 400);
        }

        if (Object.keys(profileUpdates).length > 0) {
          await admin.from("profiles").update(profileUpdates).eq("id", user_id);
        }

        await logAction(user_id, "update_profile", {
          display_name_changed: !!display_name,
          email_changed: !!email,
        });

        return jsonResponse({ ok: true });
      }

      default:
        return jsonResponse({ error: `acao desconhecida: ${action}` }, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[admin-users] erro:", message);
    return jsonResponse({ error: message }, 500);
  }
});
