import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Award, ArrowLeft, Play, CheckCircle, Star, ShoppingCart, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PaymentCheckout } from '@/components/payment/PaymentCheckout';
import { useIsPwa } from '@/hooks/useIsPwa';
import { cn } from '@/lib/utils';

const levelStyles: Record<string, string> = {
  iniciante: 'bg-success/10 text-success border-success/20',
  intermediario: 'bg-warning/10 text-warning border-warning/20',
  avancado: 'bg-destructive/10 text-destructive border-destructive/20',
};

const levelLabels: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const isPwa = useIsPwa();

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

  // Check for pending payment
  const { data: pendingPayment } = useQuery({
    queryKey: ['course-payment', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('reference_type', 'course')
        .eq('reference_id', id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
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

    // If course is free, enroll directly
    if (Number(course?.price) === 0) {
      enrollMutation.mutate();
      return;
    }

    // If course is paid, show payment dialog
    setShowPaymentDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
    queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    queryClient.invalidateQueries({ queryKey: ['course-payment', id] });
    toast({
      title: 'Pagamento confirmado!',
      description: 'Você agora tem acesso ao curso.',
    });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
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
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </main>
        {!isPwa && <Footer />}
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Curso não encontrado</h1>
            <Link to="/cursos">
              <Button variant="hero">Ver todos os cursos</Button>
            </Link>
          </div>
        </main>
        {!isPwa && <Footer />}
      </div>
    );
  }

  const isPaid = Number(course.price) > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-4 sm:py-8 pb-28 lg:pb-8">
        <div className="container mx-auto px-4">
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-8 transition-colors"
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
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted shadow-soft">
                <img
                  src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=675&fit=crop'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
                {enrollment && (
                  <div className="absolute inset-0 bg-background/85 flex items-center justify-center p-4">
                    <div className="text-center">
                      <CheckCircle className="h-10 w-10 sm:h-16 sm:w-16 mx-auto text-success mb-2 sm:mb-4" />
                      <p className="text-lg sm:text-xl font-semibold text-foreground">Você está matriculado</p>
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
                  <Badge variant="outline" className={cn('text-xs', levelStyles[course.level])}>
                    {levelLabels[course.level] ?? course.level}
                  </Badge>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground text-balance">
                  {course.title}
                </h1>
                {course.short_description && (
                  <p className="text-base sm:text-lg text-muted-foreground mt-2">
                    {course.short_description}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
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

              {/* Description */}
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-display font-semibold mb-2 sm:mb-4 text-foreground">
                  Sobre o curso
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                  {course.description}
                </p>
              </Card>

              {/* What you'll learn */}
              <Card className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-display font-semibold mb-3 sm:mb-4 text-foreground">
                  O que você vai aprender
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {['Conteúdo teórico completo', 'Exercícios práticos', 'Prova final avaliativa', 'Certificado de conclusão'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                      <span className="text-sm sm:text-base text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Includes - shown inline on mobile since sidebar is hidden */}
              <Card className="p-4 sm:p-6 lg:hidden">
                <h4 className="font-display font-semibold mb-3 text-sm text-foreground">Este curso inclui:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    Conteúdo em PDF
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    Exercícios práticos
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Star className="h-3.5 w-3.5 text-primary" />
                    Prova final
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    Certificado
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Sidebar - Hidden on mobile, sticky purchase card on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="hidden lg:block"
            >
              <Card className="sticky top-24 p-6 space-y-6 shadow-elevated">
                <div className="text-center">
                  <p className="text-4xl font-display font-bold text-primary">
                    {formatPrice(Number(course.price))}
                  </p>
                  {isPaid && (
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
                    {enrollMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : isPaid ? (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Comprar Agora
                      </>
                    ) : (
                      'Matricular Grátis'
                    )}
                  </Button>
                )}

                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="font-display font-semibold text-foreground">Este curso inclui:</h4>
                  <ul className="space-y-2 text-sm text-foreground">
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
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Sticky mobile purchase bar */}
      {!enrollment && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg p-3 shadow-floating lg:hidden safe-area-pb">
          <div className="container mx-auto flex items-center justify-between gap-4 px-1">
            <div className="min-w-0">
              <p className="text-xl font-display font-bold text-primary leading-none">
                {formatPrice(Number(course.price))}
              </p>
              {isPaid && (
                <p className="text-[11px] text-muted-foreground mt-1">Pagamento único</p>
              )}
            </div>
            <Button
              variant="hero"
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="shrink-0"
            >
              {enrollMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : isPaid ? (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Comprar
                </>
              ) : (
                'Matricular Grátis'
              )}
            </Button>
          </div>
        </div>
      )}

      {!isPwa && <Footer />}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comprar Curso</DialogTitle>
          </DialogHeader>
          {course && id && (
            <PaymentCheckout
              referenceType="course"
              referenceId={id}
              amount={Number(course.price)}
              description={`Curso: ${course.title}`}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
