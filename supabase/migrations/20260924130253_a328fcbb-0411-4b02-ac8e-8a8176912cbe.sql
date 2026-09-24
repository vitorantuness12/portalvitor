ALTER TABLE public.courses ADD COLUMN video_path text;

-- Only the course currently referencing the uploaded object can serve it to a student.
CREATE POLICY "Admins upload course videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'course-videos'
  AND public.has_role(auth.uid(), 'admin'::public.user_role)
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND lower(storage.extension(name)) IN ('mp4', 'webm')
  )
);

CREATE POLICY "Admins replace course videos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'::public.user_role))
WITH CHECK (
  bucket_id = 'course-videos'
  AND public.has_role(auth.uid(), 'admin'::public.user_role)
  AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id::text = (storage.foldername(name))[1])
);

CREATE POLICY "Admins remove course videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'::public.user_role));

CREATE POLICY "Enrolled students watch their course videos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'course-videos'
  AND (
    public.has_role(auth.uid(), 'admin'::public.user_role)
    OR EXISTS (
      SELECT 1 FROM public.courses c
      JOIN public.enrollments e ON e.course_id = c.id
      WHERE c.video_path = storage.objects.name
        AND e.user_id = auth.uid()
    )
  )
);