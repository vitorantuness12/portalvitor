-- Allow admins to delete enrollments
CREATE POLICY "Admins can delete enrollments" 
ON public.enrollments 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role));