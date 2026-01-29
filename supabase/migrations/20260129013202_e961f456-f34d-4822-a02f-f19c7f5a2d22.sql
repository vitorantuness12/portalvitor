-- Update default values for certificate_config table
ALTER TABLE public.certificate_config 
  ALTER COLUMN institution_name SET DEFAULT 'Formak',
  ALTER COLUMN back_validation_url SET DEFAULT 'https://formak.com.br/validar-certificado',
  ALTER COLUMN signature_title SET DEFAULT 'Formak';

-- Update existing records
UPDATE public.certificate_config 
SET 
  institution_name = CASE WHEN institution_name = 'Formar Ensino' THEN 'Formak' ELSE institution_name END,
  back_validation_url = CASE WHEN back_validation_url = 'https://formarensino.com.br/validar-certificado' THEN 'https://formak.com.br/validar-certificado' ELSE back_validation_url END,
  signature_title = CASE WHEN signature_title = 'Formar Ensino' THEN 'Formak' ELSE signature_title END;