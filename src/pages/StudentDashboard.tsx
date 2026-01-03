import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Calendar,
  Flame,
  Trophy,
  Target,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format, differenceInDays, subDays, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['student-enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (
            id,
            title,
            thumbnail_url,
            duration_hours
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: certificates } = useQuery({
    queryKey: ['student-certificates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate statistics
  const stats = {
    totalCourses: enrollments?.length || 0,
    completedCourses: enrollments?.filter(e => e.status === 'passed' || e.status === 'completed').length || 0,
    inProgressCourses: enrollments?.filter(e => e.status === 'in_progress').length || 0,
    totalHours: enrollments?.reduce((acc, e) => acc + (e.courses?.duration_hours || 0), 0) || 0,
    studiedHours: enrollments?.reduce((acc, e) => {
      const courseHours = e.courses?.duration_hours || 0;
      return acc + (courseHours * (e.progress / 100));
    }, 0) || 0,
    certificates: certificates?.length || 0,
    averageScore: enrollments?.filter(e => e.exam_score !== null).length 
      ? (enrollments?.filter(e => e.exam_score !== null).reduce((acc, e) => acc + Number(e.exam_score), 0) || 0) / 
        (enrollments?.filter(e => e.exam_score !== null).length || 1)
      : 0,
  };

  // Calculate streak (simplified - based on enrollment updates)
  const calculateStreak = () => {
    if (!enrollments || enrollments.length === 0) return 0;
    
    const today = startOfDay(new Date());
    const activityDays = new Set<string>();
    
    enrollments.forEach(e => {
      if (e.updated_at) {
        activityDays.add(format(new Date(e.updated_at), 'yyyy-MM-dd'));
      }
      if (e.created_at) {
        activityDays.add(format(new Date(e.created_at), 'yyyy-MM-dd'));
      }
    });

    let streak = 0;
    let checkDate = today;
    
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (activityDays.has(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (i === 0) {
        // Check yesterday if today has no activity yet
        checkDate = subDays(checkDate, 1);
        continue;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  const recentCourses = enrollments?.slice(0, 3) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
              Olá, {profile?.full_name?.split(' ')[0] || 'Estudante'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso e continue evoluindo
            </p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cursos</p>
                      <p className="text-2xl sm:text-3xl font-bold">{stats.totalCourses}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.completedCourses} concluídos
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Horas</p>
                      <p className="text-2xl sm:text-3xl font-bold">{Math.round(stats.studiedHours)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        de {stats.totalHours}h totais
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Streak</p>
                      <p className="text-2xl sm:text-3xl font-bold">{streak}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        dias consecutivos
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Certificados</p>
                      <p className="text-2xl sm:text-3xl font-bold">{stats.certificates}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        conquistados
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Cursos em Andamento</CardTitle>
                  <Link to="/meus-cursos" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {recentCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-4">Você ainda não começou nenhum curso</p>
                      <Link to="/cursos">
                        <Button variant="hero">Explorar Cursos</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentCourses.map((enrollment) => (
                        <Link 
                          key={enrollment.id} 
                          to={`/curso/${enrollment.courses?.id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <img
                              src={enrollment.courses?.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=60&fit=crop'}
                              alt={enrollment.courses?.title}
                              className="w-16 h-10 sm:w-20 sm:h-12 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">{enrollment.courses?.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={enrollment.progress} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {enrollment.progress}%
                                </span>
                              </div>
                            </div>
                            {enrollment.status === 'passed' && (
                              <Badge className="bg-success text-success-foreground shrink-0">
                                Aprovado
                              </Badge>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Side Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Média de Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">
                      {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '-'}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.averageScore >= 8 ? 'Excelente!' : stats.averageScore >= 6 ? 'Bom trabalho!' : 'Continue estudando!'}
                    </p>
                  </div>
                  {stats.averageScore > 0 && (
                    <Progress 
                      value={stats.averageScore * 10} 
                      className="mt-4 h-3" 
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    Conquistas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.totalCourses >= 1 && (
                      <Badge variant="secondary" className="text-xs">
                        🎯 Primeiro Passo
                      </Badge>
                    )}
                    {stats.completedCourses >= 1 && (
                      <Badge variant="secondary" className="text-xs">
                        ✅ Concluiu 1º Curso
                      </Badge>
                    )}
                    {stats.certificates >= 1 && (
                      <Badge variant="secondary" className="text-xs">
                        🏆 Certificado
                      </Badge>
                    )}
                    {streak >= 3 && (
                      <Badge variant="secondary" className="text-xs">
                        🔥 Streak de 3 dias
                      </Badge>
                    )}
                    {streak >= 7 && (
                      <Badge variant="secondary" className="text-xs">
                        ⚡ Streak de 7 dias
                      </Badge>
                    )}
                    {stats.averageScore >= 9 && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ Excelência
                      </Badge>
                    )}
                    {stats.totalCourses === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Comece a estudar para desbloquear conquistas!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
