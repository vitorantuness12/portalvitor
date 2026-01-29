-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reference_type TEXT NOT NULL, -- 'student_card', 'course', etc.
  reference_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'pix', 'credit_card', 'debit_card'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled', 'refunded'
  mercado_pago_id TEXT,
  mercado_pago_status TEXT,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  pix_expiration TIMESTAMP WITH TIME ZONE,
  card_last_four TEXT,
  card_brand TEXT,
  metadata JSONB DEFAULT '{}',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
ON public.payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update all payments"
ON public.payments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Service role can update (for webhook)
CREATE POLICY "Service role can update payments"
ON public.payments FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_reference ON public.payments(reference_type, reference_id);
CREATE INDEX idx_payments_mercado_pago_id ON public.payments(mercado_pago_id);