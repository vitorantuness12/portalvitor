-- Add exam_attempts column to enrollments table
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS exam_attempts integer NOT NULL DEFAULT 0;