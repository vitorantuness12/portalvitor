import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Award, Play, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { useIsPwa } from '@/hooks/useIsPwa';

export default function MyCourses() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isPwa = useIsPwa();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            short_description,
            thumbnail_url,
            duration_hours,
            level,
            categories (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string, score?: number | null) => {
    switch (status) {
      case 'passed':
        return (
          <Badge className="bg-success text-success-foreground text-[10px]">
            <CheckCircle className="h-3 w-3 mr-0.5" />
            Aprovado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="text-[10px]">
            <XCircle className="h-3 w-3 mr-0.5" />
            Reprovado
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-primary text-primary-foreground text-[10px]">
            Concluído
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px]">
            <Play className="h-3 w-3 mr-0.5" />
            Em andamento
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PwaLayout>
      <div className={isPwa ? 'px-4 py-4' : 'container mx-auto px-4 py-8'}>
        {!isPwa && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-display font-bold mb-2">Meus Cursos</h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso e continue aprendendo
            </p>
          </motion.div>
        )}

        {isLoading ? (
          <div className={isPwa ? 'space-y-3' : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={isPwa ? 'flex gap-3 p-3 border rounded-xl' : 'space-y-4 p-4 border rounded-xl'}>
                {isPwa ? (
                  <>
                    <Skeleton className="w-20 h-14 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </>
                ) : (
                  <>
                    <Skeleton className="aspect-video w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </>
                )}
              </div>
            ))}
          </div>
        ) : enrollments && enrollments.length > 0 ? (
          isPwa ? (
            /* PWA: Compact list layout */
            <div className="space-y-2">
              {enrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    to={`/curso/${enrollment.courses?.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform"
                  >
                    <img
                      src={enrollment.courses?.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=120&fit=crop'}
                      alt={enrollment.courses?.title}
                      className="w-16 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium line-clamp-1">{enrollment.courses?.title}</p>
                        {getStatusBadge(enrollment.status, enrollment.exam_score)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                          {enrollment.progress}%
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Desktop: Card grid */
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl border border-border overflow-hidden card-elevated"
                >
                  <div className="relative aspect-video">
                    <img
                      src={enrollment.courses?.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop'}
                      alt={enrollment.courses?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(enrollment.status, enrollment.exam_score)}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                        {enrollment.courses?.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {enrollment.courses?.duration_hours}h
                        </span>
                        {enrollment.courses?.categories && (
                          <Badge variant="outline">
                            {enrollment.courses.categories.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>

                    {enrollment.exam_score !== null && (
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                        <span className="text-muted-foreground">Nota da prova</span>
                        <span className={`font-bold ${Number(enrollment.exam_score) >= 8 ? 'text-success' : 'text-destructive'}`}>
                          {Number(enrollment.exam_score).toFixed(1)}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link to={`/curso/${enrollment.courses?.id}`} className="flex-1">
                        <Button variant="hero" className="w-full">
                          <Play className="h-4 w-4" />
                          Acessar Curso
                        </Button>
                      </Link>
                      {enrollment.status === 'passed' && (
                        <Link to={`/certificado/${enrollment.id}`}>
                          <Button variant="outline" size="icon">
                            <Award className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center ${isPwa ? 'py-12' : 'py-16 bg-card rounded-xl border border-border'}`}
          >
            <BookOpen className={`mx-auto text-muted-foreground mb-4 ${isPwa ? 'h-12 w-12' : 'h-16 w-16'}`} />
            <h3 className={`font-semibold mb-2 ${isPwa ? 'text-lg' : 'text-xl'}`}>Nenhum curso encontrado</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Você ainda não está matriculado em nenhum curso.
            </p>
            <Link to="/cursos">
              <Button variant="hero" size={isPwa ? 'default' : 'lg'}>
                Explorar Cursos
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </PwaLayout>
  );
}
