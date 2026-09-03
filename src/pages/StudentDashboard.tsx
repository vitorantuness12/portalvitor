import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Clock, Award, Flame, Trophy, Target, ArrowRight, CreditCard, PlayCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/common/StatCard';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsPwa } from '@/hooks/useIsPwa';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { format, subDays, startOfDay } from 'date-fns';
import { CourseImage } from '@/components/courses/CourseImage';

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

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
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
  // "Continue de onde parou" — o curso em andamento mais recente
  const continueCourse = enrollments?.find(e => e.status === 'in_progress') || enrollments?.[0];
  const recentCourses = enrollments?.slice(0, 3) || [];

  const achievements = [
    { active: stats.totalCourses >= 1, label: '1º Passo', emoji: '🎯' },
    { active: stats.totalCourses >= 3, label: '3 Cursos', emoji: '📚' },
    { active: stats.completedCourses >= 1, label: 'Concluído', emoji: '✅' },
    { active: stats.certificates >= 1, label: 'Certificado', emoji: '🏆' },
    { active: streak >= 3, label: `${streak}d seguidos`, emoji: '🔥' },
    { active: stats.averageScore >= 8, label: 'Média 8+', emoji: '⭐' },
    { active: stats.perfectScores >= 1, label: 'Nota 10', emoji: '💯' },
    { active: stats.studiedHours >= 10, label: '10h+', emoji: '⏰' },
  ];
  const unlockedCount = achievements.filter(a => a.active).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <PwaLayout>
      <div className={isPwa ? 'px-4 py-4' : 'container mx-auto px-4 py-8'}>
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={isPwa ? 'mb-5' : 'mb-8'}>
          <p className="text-[11px] font-display font-semibold uppercase tracking-[0.18em] text-primary mb-1">
            Painel do estudante
          </p>
          <h1 className={`font-display font-bold ${isPwa ? 'text-xl' : 'text-2xl sm:text-3xl'} mb-1 text-foreground`}>
            Olá, {profile?.full_name?.split(' ')[0] || 'Estudante'}! 👋
          </h1>
          <p className={`text-muted-foreground ${isPwa ? 'text-sm' : ''}`}>
            Acompanhe seu progresso e continue evoluindo
          </p>
        </motion.div>

        {/* Stats Cards - grid 2x2 mobile */}
        <div className={`grid grid-cols-2 ${isPwa ? 'gap-2.5 mb-5' : 'lg:grid-cols-4 gap-4 mb-8'}`}>
          {[
            { label: 'Cursos', value: stats.totalCourses, hint: `${stats.completedCourses} concluídos`, icon: BookOpen, tone: 'primary' as const },
            { label: 'Horas', value: Math.round(stats.studiedHours), hint: `de ${stats.totalHours}h`, icon: Clock, tone: 'info' as const },
            { label: 'Streak', value: streak, hint: 'dias seguidos', icon: Flame, tone: 'warning' as const },
            { label: 'Certificados', value: stats.certificates, hint: 'emitidos', icon: Award, tone: 'success' as const, link: '/meus-certificados' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              {stat.link ? (
                <Link to={stat.link} aria-label={`Ver ${stat.label.toLowerCase()}`} className="block active:scale-[0.97] transition-transform">
                  <StatCard label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} tone={stat.tone} />
                </Link>
              ) : (
                <StatCard label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} tone={stat.tone} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Continue de onde parou - destaque */}
        {continueCourse && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={isPwa ? 'mb-5' : 'mb-8'}>
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-elevated">
              <CardContent className={isPwa ? 'p-3' : 'p-5 sm:p-6'}>
                <p className="text-[11px] font-display font-semibold uppercase tracking-[0.14em] text-primary mb-3">
                  Continue de onde parou
                </p>
                <div className="flex items-center gap-4">
                  <CourseImage
                    thumbnailUrl={continueCourse.courses?.thumbnail_url}
                    fallbackSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=120&fit=crop"
                    alt={continueCourse.courses?.title || 'Curso'}
                    className={`${isPwa ? 'w-20 h-14' : 'w-28 h-20 sm:w-32 sm:h-24'} rounded-xl object-cover shrink-0 shadow-soft`}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-display font-semibold line-clamp-2 ${isPwa ? 'text-sm' : 'text-base sm:text-lg'} text-foreground`}>
                      {continueCourse.courses?.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={continueCourse.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">{continueCourse.progress}%</span>
                    </div>
                    <Link to={`/curso/${continueCourse.courses?.id}`} className="inline-block mt-3">
                      <Button variant="hero" size={isPwa ? 'sm' : 'default'}>
                        <PlayCircle className="h-4 w-4" />
                        Continuar curso
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Student Card Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={isPwa ? 'mb-5' : 'mb-8'}>
          <Link to="/minha-carteirinha" aria-label="Ver carteirinha de estudante">
            <Card className={`border-primary/20 bg-primary/5 active:scale-[0.98] transition-transform cursor-pointer group ${isPwa ? '' : 'hover:shadow-elevated'}`}>
              <CardContent className={isPwa ? 'py-3 px-3' : 'py-4'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${isPwa ? 'p-2' : 'p-3'} bg-primary/10 rounded-lg`}>
                      <CreditCard className={`${isPwa ? 'h-5 w-5' : 'h-6 w-6'} text-primary`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isPwa ? 'text-sm' : 'text-lg'} text-foreground`}>Carteirinha de Estudante</h3>
                      <p className={`text-muted-foreground ${isPwa ? 'text-xs' : 'text-sm'}`}>
                        Sua identificação digital
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
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
                <Link to="/meus-cursos" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {enrollmentsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                        <Skeleton className="w-16 h-10 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-1.5 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentCourses.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="Nenhum curso iniciado"
                    description="Explore nosso catálogo e comece sua jornada de aprendizado hoje mesmo."
                    action={<Link to="/cursos"><Button variant="hero" size="sm">Explorar Cursos</Button></Link>}
                    className="py-8 border-none bg-transparent"
                  />
                ) : (
                  <div className="space-y-2">
                    {recentCourses.map((enrollment) => (
                      <Link key={enrollment.id} to={`/curso/${enrollment.courses?.id}`} className="block">
                        <div className={`flex items-center gap-3 ${isPwa ? 'p-2' : 'p-3'} rounded-lg bg-muted/50 hover:bg-muted active:scale-[0.98] transition-all`}>
                          <CourseImage
                            thumbnailUrl={enrollment.courses?.thumbnail_url}
                            fallbackSrc="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=60&fit=crop"
                            alt={enrollment.courses?.title}
                            className={`${isPwa ? 'w-14 h-10' : 'w-16 h-10 sm:w-20 sm:h-12'} rounded-lg object-cover`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium line-clamp-1 ${isPwa ? 'text-xs' : 'text-sm'} text-foreground`}>{enrollment.courses?.title}</p>
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
                <CardTitle className={`flex items-center justify-between gap-2 ${isPwa ? 'text-sm' : 'text-lg'}`}>
                  <span className="flex items-center gap-2">
                    <Trophy className={`${isPwa ? 'h-4 w-4' : 'h-5 w-5'} text-warning`} />
                    Conquistas
                  </span>
                  <span className={`text-muted-foreground font-normal ${isPwa ? 'text-[10px]' : 'text-xs'}`}>{unlockedCount}/{achievements.length}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className={isPwa ? 'p-3 pt-0' : ''}>
                {stats.totalCourses === 0 ? (
                  <p className={`text-muted-foreground ${isPwa ? 'text-[10px]' : 'text-sm'}`}>
                    Comece a estudar para desbloquear conquistas!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {achievements.map((a) => (
                      <div
                        key={a.label}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-medium transition-colors ${
                          a.active
                            ? 'border-primary/30 bg-primary/10 text-foreground'
                            : 'border-border/50 bg-muted/30 text-muted-foreground opacity-50'
                        }`}
                      >
                        <span aria-hidden="true">{a.emoji}</span>
                        <span className="truncate">{a.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PwaLayout>
  );
}
