import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/courses/CourseCard';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { useIsPwa } from '@/hooks/useIsPwa';
import { supabase } from '@/integrations/supabase/client';
import { prefetchThumbnails } from '@/lib/storageImage';
import { slugify } from '@/lib/slug';
import { Seo } from '@/components/seo/Seo';
import { SITE_URL } from '@/lib/site';

/**
 * Página pública de categoria: /categoria/:slug
 * Existe principalmente para SEO — cada categoria vira uma landing page
 * indexável com título, descrição e lista de cursos.
 */
export default function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const isPwa = useIsPwa();

  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const category = useMemo(
    () => categories?.find((c) => slugify(c.name) === slug),
    [categories, slug]
  );

  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['category-courses', category?.id],
    enabled: !!category?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*, categories (name)')
        .eq('status', 'active')
        .eq('category_id', category!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      prefetchThumbnails((data ?? []).map((c) => c.thumbnail_url));
      return data;
    },
  });

  const isLoading = loadingCategories || (!!category && loadingCourses);
  const categoryName = category?.name ?? 'Categoria';
  const description =
    category?.description ||
    `Cursos online de ${categoryName} com certificado. Estude no seu ritmo pelo computador ou celular e conquiste novas oportunidades com a Formak.`;

  const content = (
    <>
      <Seo
        title={`Cursos de ${categoryName} online com certificado`}
        description={description}
        path={`/categoria/${slug}`}
        noIndex={!category && !loadingCategories}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `Cursos de ${categoryName}`,
          description,
          url: `${SITE_URL}/categoria/${slug}`,
          hasPart: (courses ?? []).slice(0, 30).map((course) => ({
            '@type': 'Course',
            name: course.title,
            url: `${SITE_URL}/curso/${course.id}`,
            provider: { '@type': 'Organization', name: 'Formak', url: SITE_URL },
          })),
        }}
      />

      <section className={isPwa ? 'px-4 pt-4' : 'container mx-auto px-4 py-8 md:py-12'}>
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/cursos">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Todos os cursos
          </Link>
        </Button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Cursos de {categoryName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-muted-foreground">{description}</p>
        </motion.div>

        <div className="mt-6 md:mt-10">
          {isLoading ? (
            <LoadingGrid />
          ) : !category ? (
            <EmptyState
              icon={BookOpen}
              title="Categoria não encontrada"
              description="Essa categoria não existe ou foi removida."
            />
          ) : (courses?.length ?? 0) === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Nenhum curso por aqui ainda"
              description="Em breve novos cursos nesta categoria."
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {courses!.map((course, index) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  shortDescription={course.short_description ?? undefined}
                  categoryName={categoryName}
                  price={Number(course.price ?? 0)}
                  durationHours={Number(course.duration_hours ?? 0)}
                  level={course.level ?? 'iniciante'}
                  thumbnailUrl={course.thumbnail_url ?? undefined}
                  priority={index < 6}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );

  if (isPwa) return <PwaLayout>{content}</PwaLayout>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{content}</main>
      <Footer />
    </div>
  );
}
