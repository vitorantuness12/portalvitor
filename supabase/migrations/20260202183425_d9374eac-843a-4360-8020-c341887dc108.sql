-- Fix foreign key constraint to allow course deletion
-- The course_generation_jobs table references courses, blocking deletion
-- We'll change it to SET NULL so job history is preserved but course can be deleted

ALTER TABLE public.course_generation_jobs
DROP CONSTRAINT IF EXISTS course_generation_jobs_course_id_fkey;

ALTER TABLE public.course_generation_jobs
ADD CONSTRAINT course_generation_jobs_course_id_fkey
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;