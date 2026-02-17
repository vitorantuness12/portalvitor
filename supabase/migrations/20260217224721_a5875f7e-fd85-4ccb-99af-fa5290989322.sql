-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;

-- Recreate with restrictions: immutable fields cannot be changed
CREATE POLICY "Service role can update payments"
ON public.payments FOR UPDATE
USING (true)
WITH CHECK (
  id = id AND
  user_id = user_id AND
  amount = amount AND
  reference_type = reference_type AND
  reference_id = reference_id
);