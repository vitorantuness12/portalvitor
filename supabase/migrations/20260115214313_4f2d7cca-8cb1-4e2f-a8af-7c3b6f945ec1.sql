-- Add badge/seal fields to certificate_config
ALTER TABLE public.certificate_config
ADD COLUMN IF NOT EXISTS left_badge_url text,
ADD COLUMN IF NOT EXISTS right_badge_url text,
ADD COLUMN IF NOT EXISTS left_badge_text text DEFAULT 'PREMIUM',
ADD COLUMN IF NOT EXISTS right_badge_text text DEFAULT 'QUALIDADE';