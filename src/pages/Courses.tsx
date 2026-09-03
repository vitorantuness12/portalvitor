import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Gift, ArrowDownUp, GraduationCap, Wallet } from 'lucide-react';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsPwa } from '@/hooks/useIsPwa';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { prefetchThumbnails } from '@/lib/storageImage';


type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'title';

export default function CoursesPage() {
  const isPwa = useIsPwa();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  useEffect(() => {
    const priceParam = searchParams.get('price');
    if (priceParam === 'free') setPriceFilter('free');
    else if (priceParam === 'paid') setPriceFilter('paid');
  }, [searchParams]);

  const handlePriceFilterChange = (filter: 'all' | 'free' | 'paid') => {
    setPriceFilter(filter);
    if (filter === 'all') searchParams.delete('price');
    else searchParams.set('price', filter);
    setSearchParams(searchParams);
  };

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', selectedCategory, selectedLevel, searchTerm, priceFilter, sortBy],
    queryFn: async () => {
      let query = supabase.from('courses').select(`*, categories (name)`).eq('status', 'active');
      if (selectedCategory) query = query.eq('category_id', selectedCategory);
      if (selectedLevel) query = query.eq('level', selectedLevel);
      if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);
      if (priceFilter === 'free') query = query.eq('price', 0);
      else if (priceFilter === 'paid') query = query.gt('price', 0);

      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'title':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      // Assina as capas em lote antes dos cards montarem: evita capas em branco.
      prefetchThumbnails((data ?? []).map((c) => c.thumbnail_url));
      return data;
    },
  });



  const levels = [
    { value: 'iniciante', label: 'Iniciante' },
    { value: 'intermediario', label: 'Intermediário' },
    { value: 'avancado', label: 'Avançado' },
  ];

  const hasActiveFilters =
    !!searchTerm || !!selectedCategory || !!selectedLevel || priceFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedLevel(null);
    handlePriceFilterChange('all');
  };

  const resultsCount = courses?.length ?? 0;

  return (
    <PwaLayout>
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
                className="pl-10 sm:pl-12 h-11 sm:h-12 bg-background/95 border-0 text-sm sm:text-base shadow-elevated"
                aria-label="Buscar cursos"
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* PWA compact search */}
      {isPwa && (
        <div className="px-4 pt-4 pb-2">
          <PageHeader
            title="Cursos"
            description="Encontre o curso perfeito para você"
            className="mb-3"
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 text-sm rounded-xl bg-muted/50 border-0"
              aria-label="Buscar cursos"
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
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                <Badge variant={selectedCategory === null ? 'default' : 'outline'} className="cursor-pointer text-xs whitespace-nowrap shrink-0 rounded-full py-1.5 px-3" onClick={() => setSelectedCategory(null)}>Todas</Badge>
                {categories?.map((cat) => (
                  <Badge key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} className="cursor-pointer text-xs whitespace-nowrap shrink-0 rounded-full py-1.5 px-3" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Badge>
                ))}
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                <Badge variant={selectedLevel === null ? 'default' : 'outline'} className="cursor-pointer text-xs whitespace-nowrap shrink-0 rounded-full py-1.5 px-3" onClick={() => setSelectedLevel(null)}>Todos</Badge>
                {levels.map((level) => (
                  <Badge key={level.value} variant={selectedLevel === level.value ? 'default' : 'outline'} className="cursor-pointer text-xs whitespace-nowrap shrink-0 rounded-full py-1.5 px-3" onClick={() => setSelectedLevel(level.value)}>{level.label}</Badge>
                ))}
                <div className="w-px bg-border shrink-0 self-stretch" />
                <Badge variant={priceFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer text-xs whitespace-nowrap shrink-0 rounded-full py-1.5 px-3" onClick={() => handlePriceFilterChange('all')}>Todos</Badge>
                <Badge variant={priceFilter === 'free' ? 'default' : 'outline'} className="cursor-pointer text-xs whitespace-nowrap shrink-0 rounded-full py-1.5 px-3" onClick={() => handlePriceFilterChange('free')}><Gift className="mr-1 h-3 w-3" aria-hidden="true" />Grátis</Badge>
                <Badge variant={priceFilter === 'paid' ? 'default' : 'outline'} className="cursor-pointer text-xs whitespace-nowrap shrink-0 rounded-full py-1.5 px-3" onClick={() => handlePriceFilterChange('paid')}><Wallet className="mr-1 h-3 w-3" aria-hidden="true" />Pagos</Badge>
              </div>
            </div>
          ) : (
            <div className="mb-6 md:mb-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-foreground">Categoria:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge variant={selectedCategory === null ? 'default' : 'outline'} className="cursor-pointer text-xs py-1.5 px-3" onClick={() => setSelectedCategory(null)}>Todas</Badge>
                  {categories?.map((cat) => (
                    <Badge key={cat.id} variant={selectedCategory === cat.id ? 'default' : 'outline'} className="cursor-pointer text-xs py-1.5 px-3" onClick={() => setSelectedCategory(cat.id)}>{cat.name}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-6">
                  <span className="text-xs sm:text-sm font-medium text-foreground">Nível:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge variant={selectedLevel === null ? 'default' : 'outline'} className="cursor-pointer text-xs py-1.5 px-3" onClick={() => setSelectedLevel(null)}>Todos</Badge>
                  {levels.map((level) => (
                    <Badge key={level.value} variant={selectedLevel === level.value ? 'default' : 'outline'} className="cursor-pointer text-xs py-1.5 px-3" onClick={() => setSelectedLevel(level.value)}>{level.label}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-6">
                  <Gift className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-foreground">Preço:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge variant={priceFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer text-xs py-1.5 px-3" onClick={() => handlePriceFilterChange('all')}>Todos</Badge>
                  <Badge variant={priceFilter === 'free' ? 'default' : 'outline'} className="cursor-pointer text-xs py-1.5 px-3" onClick={() => handlePriceFilterChange('free')}><Gift className="mr-1 h-3 w-3" aria-hidden="true" />Gratuitos</Badge>
                  <Badge variant={priceFilter === 'paid' ? 'default' : 'outline'} className="cursor-pointer text-xs py-1.5 px-3" onClick={() => handlePriceFilterChange('paid')}><Wallet className="mr-1 h-3 w-3" aria-hidden="true" />Pagos</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Results bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? 'Buscando cursos...'
                : `${resultsCount} curso${resultsCount === 1 ? '' : 's'} encontrado${resultsCount === 1 ? '' : 's'}`}
            </p>
            <div className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="h-9 w-[170px] text-xs sm:text-sm" aria-label="Ordenar cursos">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="price_asc">Menor preço</SelectItem>
                  <SelectItem value="price_desc">Maior preço</SelectItem>
                  <SelectItem value="title">Ordem alfabética</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Courses Grid */}
          {isLoading ? (
            <LoadingGrid
              count={isPwa ? 4 : 6}
              className={isPwa ? 'grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2' : undefined}
              mediaClassName={isPwa ? 'aspect-[4/3]' : 'aspect-video'}
            />
          ) : courses && courses.length > 0 ? (
            <div className={isPwa ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'}>
              {courses.map((course, index) => (
                isPwa ? (
                  <CourseCard key={course.id} id={course.id} title={course.title} shortDescription={course.short_description || undefined} categoryName={course.categories?.name} price={Number(course.price)} durationHours={course.duration_hours} level={course.level} thumbnailUrl={course.thumbnail_url || undefined} compact priority={index < 6} />
                ) : (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.05 }}>
                    <CourseCard id={course.id} title={course.title} shortDescription={course.short_description || undefined} categoryName={course.categories?.name} price={Number(course.price)} durationHours={course.duration_hours} level={course.level} thumbnailUrl={course.thumbnail_url || undefined} priority={index < 6} />

                  </motion.div>
                )
              ))}
            </div>
          ) : (
            <EmptyState
              icon={GraduationCap}
              title="Nenhum curso encontrado"
              description="Tente ajustar os filtros ou buscar por outros termos."
              action={
                hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </section>
    </PwaLayout>
  );
}
