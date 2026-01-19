-- Add onboarding_completed column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create user_interests table to store category preferences
CREATE TABLE public.user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Users can view their own interests
CREATE POLICY "Users can view their own interests"
ON public.user_interests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own interests
CREATE POLICY "Users can insert their own interests"
ON public.user_interests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own interests
CREATE POLICY "Users can delete their own interests"
ON public.user_interests
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all interests (for analytics)
CREATE POLICY "Admins can view all interests"
ON public.user_interests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));