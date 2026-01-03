import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, BookOpen, Award, ArrowLeft, Play, CheckCircle, Star } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Usuário ou curso não encontrado');
      
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      toast({
        title: 'Matrícula realizada!',
        description: 'Você agora tem acesso ao curso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na matrícula',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleEnroll = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    enrollMutation.mutate();
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const levelColors: Record<string, string> = {
    iniciante: 'bg-success/10 text-success border-success/20',
    intermediario: 'bg-warning/10 text-warning border-warning/20',
    avancado: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="aspect-video w-full rounded-xl" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Curso não encontrado</h1>
            <Link to="/cursos">
              <Button variant="hero">Ver todos os cursos</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-4 sm:py-8">
        <div className="container mx-auto px-4">
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para cursos
          </Link>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 space-y-4 sm:space-y-6"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-lg sm:rounded-xl overflow-hidden">
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=675&fit=crop'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                {enrollment && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4">
                    <div className="text-center">
                      <CheckCircle className="h-10 w-10 sm:h-16 sm:w-16 mx-auto text-success mb-2 sm:mb-4" />
                      <p className="text-lg sm:text-xl font-semibold">Você está matriculado</p>
                      <Link to={`/curso/${id}/estudar`}>
                        <Button variant="hero" size="default" className="mt-3 sm:mt-4">
                          <Play className="h-4 w-4 sm:h-5 sm:w-5" />
                          Continuar Estudando
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Meta */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                  {course.categories && (
                    <Badge className="text-xs">{course.categories.name}</Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${levelColors[course.level] || ''}`}>
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold mb-3 sm:mb-4">{course.title}</h1>
                
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {course.duration_hours}h
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Curso completo
                  </span>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Certificado
                  </span>
                </div>
              </div>

              {/* Mobile CTA - Only show on mobile when not enrolled */}
              {!enrollment && (
                <div className="lg:hidden bg-card rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(Number(course.price))}
                      </p>
                      {Number(course.price) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Pagamento único
                        </p>
                      )}
                    </div>
                    <Button
                      variant="hero"
                      onClick={handleEnroll}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? 'Processando...' : Number(course.price) === 0 ? 'Matricular Grátis' : 'Comprar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="prose max-w-none">
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Sobre o curso</h3>
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
                  {course.description}
                </p>
              </div>

              {/* What you'll learn */}
              <div className="bg-card rounded-lg sm:rounded-xl border border-border p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">O que você vai aprender</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {['Conteúdo teórico completo', 'Exercícios práticos', 'Prova final avaliativa', 'Certificado de conclusão'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                      <span className="text-sm sm:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sidebar - Hidden on mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="sticky top-24 bg-card rounded-xl border border-border p-6 space-y-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-primary">
                    {formatPrice(Number(course.price))}
                  </p>
                  {Number(course.price) > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Pagamento único • Acesso vitalício
                    </p>
                  )}
                </div>

                {enrollment ? (
                  <Link to={`/curso/${id}/estudar`} className="block">
                    <Button variant="hero" size="lg" className="w-full">
                      <Play className="h-5 w-5" />
                      Acessar Curso
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? 'Processando...' : Number(course.price) === 0 ? 'Matricular Grátis' : 'Comprar Agora'}
                  </Button>
                )}

                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="font-semibold">Este curso inclui:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Conteúdo em PDF
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      Exercícios práticos
                    </li>
                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" />
                      Prova final
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Certificado automático
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile footer info */}
          <div className="lg:hidden mt-6 bg-card rounded-lg border border-border p-4">
            <h4 className="font-semibold mb-3 text-sm">Este curso inclui:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Conteúdo em PDF
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                Exercícios práticos
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-primary" />
                Prova final
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-primary" />
                Certificado
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
