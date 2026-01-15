-- Create certificate configuration table
CREATE TABLE public.certificate_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Institution Info
  institution_name text NOT NULL DEFAULT 'Formar Ensino',
  institution_subtitle text DEFAULT 'Educação Online de Qualidade',
  institution_logo_url text,
  
  -- Front Content
  front_title text NOT NULL DEFAULT 'CERTIFICADO DE CONCLUSÃO',
  front_subtitle text DEFAULT 'Certificamos que',
  front_completion_text text DEFAULT 'concluiu com êxito o curso',
  front_hours_text text DEFAULT 'com carga horária de',
  front_date_text text DEFAULT 'Concluído em',
  front_score_text text DEFAULT 'com aproveitamento de',
  
  -- Back Content
  back_title text DEFAULT 'INFORMAÇÕES DO CERTIFICADO',
  back_content text DEFAULT 'Este certificado é válido em todo território nacional como curso livre, conforme a Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04.',
  back_validation_text text DEFAULT 'Para validar este certificado, acesse:',
  back_validation_url text DEFAULT 'https://formarensino.com.br/validar-certificado',
  
  -- Signature
  signature_name text DEFAULT 'Diretor(a) Acadêmico(a)',
  signature_title text DEFAULT 'Formar Ensino',
  signature_image_url text,
  
  -- Styling
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#7C3AED',
  text_color text DEFAULT '#1F2937',
  background_color text DEFAULT '#FFFFFF',
  accent_gradient boolean DEFAULT true,
  
  -- Border & Design
  border_style text DEFAULT 'elegant',
  show_qr_code boolean DEFAULT true,
  show_back_side boolean DEFAULT true,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.certificate_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage certificate config
CREATE POLICY "Admins can manage certificate config"
  ON public.certificate_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Anyone can view config (needed for certificate generation)
CREATE POLICY "Anyone can view certificate config"
  ON public.certificate_config
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_certificate_config_updated_at
  BEFORE UPDATE ON public.certificate_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.certificate_config (institution_name) VALUES ('Formar Ensino');