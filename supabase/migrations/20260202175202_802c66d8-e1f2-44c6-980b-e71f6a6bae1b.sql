-- Criar tabela para rastrear jobs de geração de cursos
CREATE TABLE IF NOT EXISTS public.course_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  duration INTEGER NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  price NUMERIC DEFAULT 0,
  content_depth TEXT DEFAULT 'detalhado',
  openai_model TEXT DEFAULT 'gpt-4o-mini',
  additional_instructions TEXT,
  course_id UUID REFERENCES public.courses(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.course_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Policies for admins only
CREATE POLICY "Admins can view all jobs"
ON public.course_generation_jobs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create jobs"
ON public.course_generation_jobs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update jobs"
ON public.course_generation_jobs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_course_generation_jobs_updated_at
BEFORE UPDATE ON public.course_generation_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();