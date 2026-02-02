-- Add progress_detail column for detailed progress tracking during module generation
ALTER TABLE public.course_generation_jobs 
ADD COLUMN progress_detail TEXT;