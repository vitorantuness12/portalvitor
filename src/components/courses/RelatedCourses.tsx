import { useQuery } from '@tanstack/react-query';
import { CourseCard } from '@/components/courses/CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { prefetchThumbnails } from '@/lib/storageImage';

interface RelatedCoursesProps {
  categoryId: string | null;
  currentCourseId: string;
}

export function RelatedCourses({ categoryId, currentCourseId }: RelatedCoursesProps) {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['related-courses', categoryId, currentCourseId],
    enabled: Boolean(categoryId),
    queryFn: async () => {
      if (!categoryId) return [];

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, short_description, price, duration_hours, level, thumbnail_url, categories (name)')
        .eq('status', 'active')
        .eq('category_id', categoryId)
        .neq('id', currentCourseId)
        .order('price', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      prefetchThumbnails((data ?? []).map((course) => course.thumbnail_url));
      return data ?? [];
    },
  });

  if (!categoryId || (!isLoading && !courses?.length)) return null;

  return (
    <section className="mt-8 sm:mt-12" aria-labelledby="related-courses-title">
      <h2 id="related-courses-title" className="font-display text-xl font-bold text-foreground sm:text-2xl">
        Outros cursos desta categoria
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={`related-course-skeleton-${index}`} className="space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/5" />
              </div>
            ))
          : courses?.map((relatedCourse, index) => (
              <CourseCard
                key={relatedCourse.id}
                id={relatedCourse.id}
                title={relatedCourse.title}
                shortDescription={relatedCourse.short_description ?? undefined}
                categoryName={relatedCourse.categories?.name}
                price={Number(relatedCourse.price ?? 0)}
                durationHours={Number(relatedCourse.duration_hours ?? 0)}
                level={relatedCourse.level ?? 'iniciante'}
                thumbnailUrl={relatedCourse.thumbnail_url ?? undefined}
                compact
                priority={index < 2}
              />
            ))}
      </div>
    </section>
  );
}