-- Create enums for student card
CREATE TYPE public.student_card_plan_type AS ENUM ('digital', 'printed');
CREATE TYPE public.student_card_status AS ENUM ('pending_payment', 'active', 'expired', 'cancelled');
CREATE TYPE public.shipping_status AS ENUM ('pending', 'processing', 'shipped', 'delivered');

-- Create student_cards table
CREATE TABLE public.student_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_code TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  plan_type public.student_card_plan_type NOT NULL DEFAULT 'digital',
  status public.student_card_status NOT NULL DEFAULT 'pending_payment',
  shipping_address JSONB,
  shipping_status public.shipping_status,
  issued_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  amount_paid NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_student_cards_user_id ON public.student_cards(user_id);
CREATE INDEX idx_student_cards_card_code ON public.student_cards(card_code);
CREATE INDEX idx_student_cards_status ON public.student_cards(status);

-- Enable RLS
ALTER TABLE public.student_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own student cards"
ON public.student_cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own student cards"
ON public.student_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student cards"
ON public.student_cards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all student cards"
ON public.student_cards FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update all student cards"
ON public.student_cards FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete student cards"
ON public.student_cards FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can validate student cards by code"
ON public.student_cards FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_student_cards_updated_at
BEFORE UPDATE ON public.student_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for student card photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-card-photos', 'student-card-photos', true);

-- Storage policies for student card photos
CREATE POLICY "Users can upload their own student card photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-card-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own student card photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-card-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own student card photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-card-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Student card photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-card-photos');