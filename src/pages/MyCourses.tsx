import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Award, Play, CheckCircle, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsPwa } from '@/hooks/useIsPwa';
import { CreditCard, GraduationCap } from 'lucide-react';

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
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Reprovado
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-primary text-primary-foreground">
            Concluído
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Play className="h-3 w-3 mr-1" />
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
    <div className="min-h-screen flex flex-col">
      {!isPwa && <Header />}
      <main className={`flex-1 ${isPwa ? 'pt-14 pb-8' : 'py-8'}`}>
        <div className="container mx-auto px-4">
          {/* Quick Access Buttons */}
          <motion.div 
            className="grid grid-cols-2 gap-2 mb-4 md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link to="/cursos">
              <Button variant="outline" className="w-full text-sm" size="sm">
                <BookOpen className="h-4 w-4 mr-1.5" />
                Cursos
              </Button>
            </Link>
            <Link to="/meu-progresso">
              <Button variant="outline" className="w-full text-sm" size="sm">
                <Award className="h-4 w-4 mr-1.5" />
                Progresso
              </Button>
            </Link>
            <Link to="/meus-certificados">
              <Button variant="outline" className="w-full text-sm" size="sm">
                <GraduationCap className="h-4 w-4 mr-1.5" />
                Certificados
              </Button>
            </Link>
            <Link to="/minha-carteirinha">
              <Button variant="outline" className="w-full text-sm" size="sm">
                <CreditCard className="h-4 w-4 mr-1.5" />
                Carteirinha
              </Button>
            </Link>
          </motion.div>

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

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4 p-4 border rounded-xl">
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : enrollments && enrollments.length > 0 ? (
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
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card rounded-xl border border-border"
            >
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum curso encontrado</h3>
              <p className="text-muted-foreground mb-6">
                Você ainda não está matriculado em nenhum curso.
              </p>
              <Link to="/cursos">
                <Button variant="hero" size="lg">
                  Explorar Cursos
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </main>
      {!isPwa && <Footer />}
    </div>
  );
}
