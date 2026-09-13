DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;
CREATE POLICY "Service role can update payments"
ON public.payments
FOR UPDATE
TO service_role
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');