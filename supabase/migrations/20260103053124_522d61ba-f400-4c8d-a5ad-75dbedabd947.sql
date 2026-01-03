-- Create bucket for course thumbnails if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload course thumbnails
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'course-thumbnails' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated users to update course thumbnails
CREATE POLICY "Admins can update course thumbnails"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'course-thumbnails' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow authenticated users to delete course thumbnails
CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'course-thumbnails' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow public read access to course thumbnails
CREATE POLICY "Public can view course thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-thumbnails');