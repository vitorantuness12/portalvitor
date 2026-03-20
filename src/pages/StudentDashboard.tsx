import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Clock, Award, TrendingUp, Calendar, Flame, Trophy, Target, ArrowRight, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsPwa } from '@/hooks/useIsPwa';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { format, subDays, startOfDay } from 'date-fns';

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isPwa = useIsPwa();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
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
        .select(`*, courses (id, title, thumbnail_url, duration_hours)`)
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
      const { data, error } = await supabase.from('certificates').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

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
    perfectScores: enrollments?.filter(e => Number(e.exam_score) === 10).length || 0,
    highScores: enrollments?.filter(e => Number(e.exam_score) >= 9).length || 0,
  };

  const calculateStreak = () => {
    if (!enrollments || enrollments.length === 0) return 0;
    const today = startOfDay(new Date());
    const activityDays = new Set<string>();
    enrollments.forEach(e => {
      if (e.updated_at) activityDays.add(format(new Date(e.updated_at), 'yyyy-MM-dd'));
      if (e.created_at) activityDays.add(format(new Date(e.created_at), 'yyyy-MM-dd'));
    });
    let streak = 0;
    let checkDate = today;
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (activityDays.has(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (i === 0) {
        checkDate = subDays(checkDate, 1);
        continue;
      } else break;
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
    <PwaLayout>
      <div className={isPwa ? 'px-4 py-4' : 'container mx-auto px-4 py-8'}>
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={isPwa ? 'mb-5' : 'mb-8'}>
          <h1 className={`font-display font-bold ${isPwa ? 'text-xl' : 'text-2xl sm:text-3xl'} mb-1`}>
            Olá, {profile?.full_name?.split(' ')[0] || 'Estudante'}! 👋
          </h1>
          <p className={`text-muted-foreground ${isPwa ? 'text-sm' : ''}`}>
            Acompanhe seu progresso e continue evoluindo
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-2 ${isPwa ? 'gap-2.5 mb-5' : 'lg:grid-cols-4 gap-4 mb-8'}`}>
          {[
            { label: 'Cursos', value: stats.totalCourses, sub: `${stats.completedCourses} concluídos`, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Horas', value: Math.round(stats.studiedHours), sub: `de ${stats.totalHours}h`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Streak', value: streak, sub: 'dias', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Certificados', value: stats.certificates, sub: 'emitidos', icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10', link: '/meus-certificados' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              {stat.link ? (
                <Link to={stat.link}>
                  <Card className={`h-full active:scale-[0.97] transition-transform ${isPwa ? 'border-border/50' : ''}`}>
                    <CardContent className={isPwa ? 'p-3' : 'pt-6'}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-muted-foreground ${isPwa ? 'text-xs' : 'text-sm'}`}>{stat.label}</p>
                          <p className={`font-bold tabular-nums ${isPwa ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>{stat.value}</p>
                          <p className={`text-muted-foreground ${isPwa ? 'text-[10px]' : 'text-xs'} mt-0.5`}>{stat.sub}</p>
                        </div>
                        <div className={`${isPwa ? 'p-2' : 'p-3'} ${stat.bg} rounded-lg`}>
                          <stat.icon className={`${isPwa ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Card className={`h-full ${isPwa ? 'border-border/50' : ''}`}>
                  <CardContent className={isPwa ? 'p-3' : 'pt-6'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-muted-foreground ${isPwa ? 'text-xs' : 'text-sm'}`}>{stat.label}</p>
                        <p className={`font-bold tabular-nums ${isPwa ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>{stat.value}</p>
                        <p className={`text-muted-foreground ${isPwa ? 'text-[10px]' : 'text-xs'} mt-0.5`}>{stat.sub}</p>
                      </div>
                      <div className={`${isPwa ? 'p-2' : 'p-3'} ${stat.bg} rounded-lg`}>
                        <stat.icon className={`${isPwa ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </div>

        {/* Student Card Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={isPwa ? 'mb-5' : 'mb-8'}>
          <Link to="/minha-carteirinha">
            <Card className={`bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 active:scale-[0.98] transition-transform cursor-pointer group ${isPwa ? '' : 'hover:shadow-lg'}`}>
              <CardContent className={isPwa ? 'py-3 px-3' : 'py-4'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${isPwa ? 'p-2' : 'p-3'} bg-primary/10 rounded-lg`}>
                      <CreditCard className={`${isPwa ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isPwa ? 'text-sm' : 'text-lg'}`}>Carteirinha de Estudante</h3>
                      <p className={`text-muted-foreground ${isPwa ? 'text-xs' : 'text-sm'}`}>
                        Sua identificação digital
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        <div className={isPwa ? 'space-y-5' : 'grid lg:grid-cols-3 gap-6'}>
          {/* Progress Overview */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={isPwa ? '' : 'lg:col-span-2'}>
            <Card className={isPwa ? 'border-border/50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className={isPwa ? 'text-base' : 'text-lg'}>Cursos em Andamento</CardTitle>
                <Link to="/meus-cursos" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {recentCourses.length === 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4 text-sm">Nenhum curso iniciado</p>
                    <Link to="/cursos"><Button variant="hero" size="sm">Explorar Cursos</Button></Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentCourses.map((enrollment) => (
                      <Link key={enrollment.id} to={`/curso/${enrollment.courses?.id}`} className="block">
                        <div className={`flex items-center gap-3 ${isPwa ? 'p-2' : 'p-3'} rounded-lg bg-muted/50 hover:bg-muted active:scale-[0.98] transition-all`}>
                          <img
                            src={enrollment.courses?.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=60&fit=crop'}
                            alt={enrollment.courses?.title}
                            className={`${isPwa ? 'w-14 h-10' : 'w-16 h-10 sm:w-20 sm:h-12'} rounded-lg object-cover`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium line-clamp-1 ${isPwa ? 'text-xs' : 'text-sm'}`}>{enrollment.courses?.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                              <span className="text-[10px] text-muted-foreground tabular-nums">{enrollment.progress}%</span>
                            </div>
                          </div>
                          {enrollment.status === 'passed' && (
                            <Badge className="bg-success text-success-foreground shrink-0 text-[10px]">✓</Badge>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className={isPwa ? 'grid grid-cols-2 gap-2.5' : 'space-y-6'}>
            <Card className={isPwa ? 'border-border/50' : ''}>
              <CardHeader className={isPwa ? 'pb-2 p-3' : ''}>
                <CardTitle className={`flex items-center gap-2 ${isPwa ? 'text-sm' : 'text-lg'}`}>
                  <Target className={`${isPwa ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                  Média
                </CardTitle>
              </CardHeader>
              <CardContent className={isPwa ? 'p-3 pt-0' : ''}>
                <div className="text-center">
                  <div className={`font-bold text-primary ${isPwa ? 'text-2xl' : 'text-4xl'}`}>
                    {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : '-'}
                  </div>
                  <p className={`text-muted-foreground mt-1 ${isPwa ? 'text-[10px]' : 'text-sm'}`}>
                    {stats.averageScore >= 8 ? 'Excelente!' : stats.averageScore >= 6 ? 'Bom!' : 'Continue!'}
                  </p>
                </div>
                {stats.averageScore > 0 && <Progress value={stats.averageScore * 10} className={`mt-3 ${isPwa ? 'h-1.5' : 'h-3'}`} />}
              </CardContent>
            </Card>

            <Card className={isPwa ? 'border-border/50' : ''}>
              <CardHeader className={isPwa ? 'pb-2 p-3' : ''}>
                <CardTitle className={`flex items-center gap-2 ${isPwa ? 'text-sm' : 'text-lg'}`}>
                  <Trophy className={`${isPwa ? 'h-4 w-4' : 'h-5 w-5'} text-amber-500`} />
                  Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent className={isPwa ? 'p-3 pt-0' : ''}>
                <div className="flex flex-wrap gap-1">
                  {stats.totalCourses >= 1 && <Badge variant="secondary" className="text-[10px]">🎯 1º Passo</Badge>}
                  {stats.totalCourses >= 3 && <Badge variant="secondary" className="text-[10px]">📚 3 Cursos</Badge>}
                  {stats.completedCourses >= 1 && <Badge variant="secondary" className="text-[10px]">✅ Concluído</Badge>}
                  {stats.certificates >= 1 && <Badge variant="secondary" className="text-[10px]">🏆 Certificado</Badge>}
                  {streak >= 3 && <Badge variant="secondary" className="text-[10px]">🔥 {streak}d</Badge>}
                  {stats.averageScore >= 8 && <Badge variant="secondary" className="text-[10px]">⭐ Média 8+</Badge>}
                  {stats.perfectScores >= 1 && <Badge variant="secondary" className="text-[10px]">💯 Nota 10</Badge>}
                  {stats.studiedHours >= 10 && <Badge variant="secondary" className="text-[10px]">⏰ 10h+</Badge>}
                  {stats.totalCourses === 0 && (
                    <p className={`text-muted-foreground ${isPwa ? 'text-[10px]' : 'text-sm'}`}>
                      Comece a estudar!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PwaLayout>
  );
}
