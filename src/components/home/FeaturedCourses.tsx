import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CourseCard } from '@/components/courses/CourseCard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function FeaturedCourses() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('status', 'active')
        .limit(6);

      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="relative py-20 sm:py-28 lg:py-36">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <div className="space-y-4 max-w-xl">
            <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Mais procurados
            </Badge>
            <h2 className="font-display font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl">
              Cursos em{' '}
              <span className="hero-gradient-text">destaque</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg">
              Escolha entre nossas formações mais populares e comece sua jornada de aprendizado hoje.
            </p>
          </div>
          
          <Link
            to="/cursos"
            className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all self-start sm:self-auto"
          >
            Ver catálogo completo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-1/3" />
              </div>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <CourseCard
                  id={course.id}
                  title={course.title}
                  shortDescription={course.short_description || undefined}
                  categoryName={course.categories?.name}
                  price={Number(course.price)}
                  durationHours={course.duration_hours}
                  level={course.level}
                  thumbnailUrl={course.thumbnail_url || undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-2">
              Nenhum curso disponível no momento.
            </p>
            <p className="text-sm text-muted-foreground">
              Novos cursos serão adicionados em breve!
            </p>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link to="/cursos">
            <Button variant="outline" size="lg" className="gap-2 text-base px-8">
              Ver Todos os Cursos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
