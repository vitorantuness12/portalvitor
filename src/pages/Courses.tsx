import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', selectedCategory, selectedLevel, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('courses')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('status', 'active');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedLevel) {
        query = query.eq('level', selectedLevel);
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const levels = [
    { value: 'iniciante', label: 'Iniciante' },
    { value: 'intermediario', label: 'Intermediário' },
    { value: 'avancado', label: 'Avançado' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4"
            >
              Explore Nossos Cursos
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto"
            >
              Encontre o curso perfeito para impulsionar sua carreira
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-xl mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-background/95 border-0"
              />
            </motion.div>
          </div>
        </section>

        {/* Filters & Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Categorias:</span>
                <Badge
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  Todas
                </Badge>
                {categories?.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium ml-6">Nível:</span>
                <Badge
                  variant={selectedLevel === null ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedLevel(null)}
                >
                  Todos
                </Badge>
                {levels.map((level) => (
                  <Badge
                    key={level.value}
                    variant={selectedLevel === level.value ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedLevel(level.value)}
                  >
                    {level.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Courses Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-10 w-1/3" />
                  </div>
                ))}
              </div>
            ) : courses && courses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
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
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-lg text-muted-foreground mb-2">
                  Nenhum curso encontrado
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros ou busque por outros termos
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(null);
                    setSelectedLevel(null);
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
