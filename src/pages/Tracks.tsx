import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Layers, BookOpen, ArrowRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/components/seo/Seo';
import { CourseImage } from '@/components/courses/CourseImage';

export interface TrackListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  original_price: number | null;
  track_courses: { course_id: string }[];
}

export function formatPrice(value: number) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

export default function Tracks() {
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['learning-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_tracks')
        .select('id, title, slug, description, thumbnail_url, price, original_price, track_courses (course_id)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrackListItem[];
    },
  });

  return (
    <PwaLayout>
      <Seo
        title="Trilhas de carreira"
        description="Combos de cursos com desconto e certificado de trilha para você avançar mais rápido na carreira."
        path="/trilhas"
      />

      <div className="container mx-auto px-4 py-6 sm:py-10 space-y-6">
        <PageHeader
          eyebrow="Trilhas"
          title="Trilhas de carreira"
          description="Vários cursos combinados, com preço menor e um certificado extra de conclusão da trilha."
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : !tracks?.length ? (
          <EmptyState
            icon={Layers}
            title="Nenhuma trilha disponível"
            description="Em breve novas trilhas de carreira estarão por aqui."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full overflow-hidden rounded-2xl">
                  <div className="relative aspect-video bg-muted">
                    <CourseImage
                      thumbnailUrl={track.thumbnail_url}
                      alt={track.title}
                      className="h-full w-full object-cover"
                    />
                    <Badge className="absolute left-3 top-3 gap-1">
                      <Layers className="h-3 w-3" />
                      {track.track_courses?.length ?? 0} cursos
                    </Badge>
                  </div>
                  <CardContent className="flex h-[calc(100%-0px)] flex-col gap-3 p-4">
                    <h2 className="font-display text-lg font-bold leading-tight line-clamp-2">
                      {track.title}
                    </h2>
                    {track.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{track.description}</p>
                    )}
                    <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-2">
                        {track.original_price && track.original_price > track.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(track.original_price)}
                          </span>
                        )}
                        <span className="text-xl font-bold text-primary">{formatPrice(track.price)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Award className="h-3.5 w-3.5" />
                        Certificado de trilha incluso
                      </div>
                      <Button asChild className="w-full">
                        <Link to={`/trilha/${track.slug}`}>
                          Ver trilha
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <Link to="/cursos" className="underline underline-offset-4">
            Ver cursos avulsos
          </Link>
        </div>
      </div>
    </PwaLayout>
  );
}
