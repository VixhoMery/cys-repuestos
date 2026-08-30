-- ============================================================
-- C&S Repuestos
-- Programar reporte mensual
-- ============================================================
--
-- ANTES DE EJECUTAR:
--
-- 1. Edge Function monthly-sales-report desplegada.
--
-- 2. En Supabase Vault crear DOS secretos:
--
--    Nombre:
--      monthly_report_project_url
--    Valor:
--      https://TU_PROJECT_REF.supabase.co
--
--    Nombre:
--      monthly_report_cron_secret
--    Valor:
--      EL MISMO valor de REPORT_CRON_SECRET
--      configurado en Edge Function Secrets.
--
-- Este archivo NO contiene secretos reales.
-- ============================================================


CREATE EXTENSION IF NOT EXISTS
  pg_cron
WITH SCHEMA extensions;

CREATE EXTENSION IF NOT EXISTS
  pg_net
WITH SCHEMA extensions;


-- Si el job ya existe, eliminarlo antes
-- de volver a crearlo.
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  SELECT jobid
  INTO v_job_id
  FROM cron.job
  WHERE jobname =
    'cys-monthly-sales-report'
  LIMIT 1;

  IF v_job_id IS NOT NULL THEN
    PERFORM
      cron.unschedule(
        v_job_id
      );
  END IF;
END;
$$;


-- Primer día de cada mes, 12:00 UTC.
-- En Chile continental normalmente cae
-- alrededor de las 08:00–09:00 según DST.
SELECT cron.schedule(
  'cys-monthly-sales-report',
  '0 12 1 * *',
  $cron$
    SELECT net.http_post(
      url := (
        SELECT
          decrypted_secret
        FROM
          vault.decrypted_secrets
        WHERE
          name =
            'monthly_report_project_url'
        LIMIT 1
      ) ||
      '/functions/v1/monthly-sales-report',

      headers :=
        jsonb_build_object(
          'Content-Type',
          'application/json',

          'x-cys-report-secret',
          (
            SELECT
              decrypted_secret
            FROM
              vault.decrypted_secrets
            WHERE
              name =
                'monthly_report_cron_secret'
            LIMIT 1
          )
        ),

      body :=
        jsonb_build_object(
          'source',
          'supabase-cron'
        )
    ) AS request_id;
  $cron$
);


-- Verificar el job creado:
SELECT
  jobid,
  jobname,
  schedule,
  active
FROM
  cron.job
WHERE
  jobname =
    'cys-monthly-sales-report';
