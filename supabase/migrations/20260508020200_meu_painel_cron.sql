-- ============================================================
-- pg_cron: dispara edge function notify-prazos diariamente
-- ============================================================
--
-- Habilita pg_cron (pg_net ja esta instalado). Agenda 1x ao dia
-- as 11:00 UTC = 08:00 America/Sao_Paulo. A edge function decide
-- quais itens avisar e atualiza ultimo_aviso_em (idempotencia).
--
-- Auth: usa a anon JWT (verify_jwt=true na edge), que e publica
-- por design e nao da acesso a dados — a edge usa service_role
-- internamente via SUPABASE_SERVICE_ROLE_KEY.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove agendamento anterior (idempotente em re-runs)
DO $$
DECLARE
  v_jobid BIGINT;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'notify-prazos-diario';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;
END $$;

SELECT cron.schedule(
  'notify-prazos-diario',
  '0 11 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://uprcgywrotmabwnyorur.supabase.co/functions/v1/notify-prazos',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcmNneXdyb3RtYWJ3bnlvcnVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDk3NzMsImV4cCI6MjA3OTY4NTc3M30.5gSX2S3N_5X_7r_iCTqKxMOMHGxPj15vyfS1PlrtreY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $cron$
);
