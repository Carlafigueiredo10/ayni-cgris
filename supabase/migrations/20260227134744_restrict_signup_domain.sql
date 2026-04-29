CREATE OR REPLACE FUNCTION public.check_allowed_email_domain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email NOT LIKE '%@gestao.gov.br' THEN
    RAISE EXCEPTION 'Cadastro permitido apenas para emails @gestao.gov.br';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_domain ON auth.users;
CREATE TRIGGER enforce_email_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_allowed_email_domain();
