import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Gift } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsPwa } from '@/hooks/useIsPwa';

export default function CoursesPage() {
  const isPwa = useIsPwa();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');

  // Sync price filter from URL on mount
  useEffect(() => {
    const priceParam = searchParams.get('price');
    if (priceParam === 'free') {
      setPriceFilter('free');
    } else if (priceParam === 'paid') {
      setPriceFilter('paid');
    }
  }, [searchParams]);

  // Update URL when price filter changes
  const handlePriceFilterChange = (filter: 'all' | 'free' | 'paid') => {
    setPriceFilter(filter);
    if (filter === 'all') {
      searchParams.delete('price');
    } else {
      searchParams.set('price', filter);
    }
    setSearchParams(searchParams);
  };

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
    queryKey: ['courses', selectedCategory, selectedLevel, searchTerm, priceFilter],
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

      if (priceFilter === 'free') {
        query = query.eq('price', 0);
      } else if (priceFilter === 'paid') {
        query = query.gt('price', 0);
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
        {/* Hero - hidden in PWA */}
        {!isPwa && (
          <section className="hero-gradient py-10 md:py-16">
            <div className="container mx-auto px-4 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-3 md:mb-4"
              >
                Explore Nossos Cursos
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base md:text-lg text-primary-foreground/80 mb-6 md:mb-8 max-w-2xl mx-auto px-2"
              >
                Encontre o curso perfeito para impulsionar sua carreira
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-xl mx-auto relative"
              >
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:pl-12 h-10 sm:h-12 bg-background/95 border-0 text-sm sm:text-base"
                />
              </motion.div>
            </div>
          </section>
        )}

        {/* PWA compact search */}
        {isPwa && (
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Filters & Content */}
        <section className={isPwa ? 'py-2' : 'py-8 md:py-12'}>
          <div className={isPwa ? 'px-4' : 'container mx-auto px-4'}>
            {/* Filters */}
            {isPwa ? (
              <div className="mb-3 space-y-2">
                {/* Categories - horizontal scroll */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                  <Badge
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    className="cursor-pointer text-xs whitespace-nowrap shrink-0"
                    onClick={() => setSelectedCategory(null)}
                  >
                    Todas
                  </Badge>
                  {categories?.map((cat) => (
                    <Badge
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      className="cursor-pointer text-xs whitespace-nowrap shrink-0"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Badge>
                  ))}
                </div>
                {/* Level + Price - horizontal scroll */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                  <Badge
                    variant={selectedLevel === null ? 'default' : 'outline'}
                    className="cursor-pointer text-xs whitespace-nowrap shrink-0"
                    onClick={() => setSelectedLevel(null)}
                  >
                    Todos
                  </Badge>
                  {levels.map((level) => (
                    <Badge
                      key={level.value}
                      variant={selectedLevel === level.value ? 'default' : 'outline'}
                      className="cursor-pointer text-xs whitespace-nowrap shrink-0"
                      onClick={() => setSelectedLevel(level.value)}
                    >
                      {level.label}
                    </Badge>
                  ))}
                  <div className="w-px bg-border shrink-0 self-stretch" />
                  <Badge
                    variant={priceFilter === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer text-xs whitespace-nowrap shrink-0"
                    onClick={() => handlePriceFilterChange('all')}
                  >
                    Todos
                  </Badge>
                  <Badge
                    variant={priceFilter === 'free' ? 'default' : 'outline'}
                    className="cursor-pointer text-xs whitespace-nowrap shrink-0"
                    onClick={() => handlePriceFilterChange('free')}
                  >
                    🎁 Grátis
                  </Badge>
                  <Badge
                    variant={priceFilter === 'paid' ? 'default' : 'outline'}
                    className="cursor-pointer text-xs whitespace-nowrap shrink-0"
                    onClick={() => handlePriceFilterChange('paid')}
                  >
                    💰 Pagos
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
                <div className="flex items-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2 w-full sm:w-auto mb-1 sm:mb-0">
                    <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">Categorias:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    <Badge
                      variant={selectedCategory === null ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Todas
                    </Badge>
                    {categories?.map((cat) => (
                      <Badge
                        key={cat.id}
                        variant={selectedCategory === cat.id ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2 w-full sm:w-auto mb-1 sm:mb-0">
                    <span className="text-xs sm:text-sm font-medium sm:ml-6">Nível:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 sm:ml-0">
                    <Badge
                      variant={selectedLevel === null ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => setSelectedLevel(null)}
                    >
                      Todos
                    </Badge>
                    {levels.map((level) => (
                      <Badge
                        key={level.value}
                        variant={selectedLevel === level.value ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => setSelectedLevel(level.value)}
                      >
                        {level.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2 w-full sm:w-auto mb-1 sm:mb-0">
                    <Gift className="h-4 w-4 text-muted-foreground shrink-0 sm:ml-6" />
                    <span className="text-xs sm:text-sm font-medium">Preço:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 sm:ml-0">
                    <Badge
                      variant={priceFilter === 'all' ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => handlePriceFilterChange('all')}
                    >
                      Todos
                    </Badge>
                    <Badge
                      variant={priceFilter === 'free' ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => handlePriceFilterChange('free')}
                    >
                      🎁 Gratuitos
                    </Badge>
                    <Badge
                      variant={priceFilter === 'paid' ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() => handlePriceFilterChange('paid')}
                    >
                      💰 Pagos
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Grid */}
            {isLoading ? (
              <div className={isPwa ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={isPwa ? 'space-y-2' : 'space-y-3 sm:space-y-4'}>
                    <Skeleton className={isPwa ? 'aspect-[4/3] w-full rounded-lg' : 'aspect-video w-full'} />
                    <Skeleton className={isPwa ? 'h-4 w-3/4' : 'h-5 sm:h-6 w-3/4'} />
                    <Skeleton className={isPwa ? 'h-3 w-1/2' : 'h-3 sm:h-4 w-full'} />
                  </div>
                ))}
              </div>
            ) : courses && courses.length > 0 ? (
              <div className={isPwa ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'}>
                {courses.map((course, index) => (
                  isPwa ? (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      shortDescription={course.short_description || undefined}
                      categoryName={course.categories?.name}
                      price={Number(course.price)}
                      durationHours={course.duration_hours}
                      level={course.level}
                      thumbnailUrl={course.thumbnail_url || undefined}
                      compact
                    />
                  ) : (
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
                  )
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
                    handlePriceFilterChange('all');
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      {!isPwa && <Footer />}
    </div>
  );
}
