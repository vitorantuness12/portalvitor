CREATE TABLE public.payment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  unit_price NUMERIC(10,2) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_items_payment_course_key UNIQUE (payment_id, course_id),
  CONSTRAINT payment_items_unit_price_nonnegative CHECK (unit_price >= 0)
);

GRANT SELECT ON public.payment_items TO authenticated;
GRANT ALL ON public.payment_items TO service_role;

ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment items"
ON public.payment_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.payments
    WHERE payments.id = payment_items.payment_id
      AND payments.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all payment items"
ON public.payment_items
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.user_role));

CREATE INDEX idx_payment_items_payment_id ON public.payment_items(payment_id);
CREATE INDEX idx_payment_items_course_id ON public.payment_items(course_id);

CREATE TRIGGER update_payment_items_updated_at
BEFORE UPDATE ON public.payment_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();