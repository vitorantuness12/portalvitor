-- Add wave style configuration fields
ALTER TABLE public.certificate_config 
ADD COLUMN IF NOT EXISTS front_wave_style text DEFAULT 'curves',
ADD COLUMN IF NOT EXISTS back_wave_style text DEFAULT 'curves',
ADD COLUMN IF NOT EXISTS show_front_waves boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_back_waves boolean DEFAULT true;