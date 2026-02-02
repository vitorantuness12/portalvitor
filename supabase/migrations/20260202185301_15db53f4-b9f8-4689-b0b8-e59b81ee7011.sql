-- Add column to track which modules have been generated
-- This allows resuming generation after timeout
ALTER TABLE public.course_generation_jobs
ADD COLUMN IF NOT EXISTS modules_generated JSONB DEFAULT '[]'::jsonb;

-- Add column to store partial course data (structure)
ALTER TABLE public.course_generation_jobs
ADD COLUMN IF NOT EXISTS partial_course_data JSONB DEFAULT NULL;