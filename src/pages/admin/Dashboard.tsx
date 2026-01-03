import { motion } from 'framer-motion';
import { BookOpen, Users, Award, TrendingUp, GraduationCap, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [coursesRes, usersRes, enrollmentsRes, certificatesRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id, status', { count: 'exact' }),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
      ]);

      const passedCount = enrollmentsRes.data?.filter(e => e.status === 'passed').length || 0;
      const totalEnrollments = enrollmentsRes.count || 0;
      const passRate = totalEnrollments > 0 ? Math.round((passedCount / totalEnrollments) * 100) : 0;

      return {
        courses: coursesRes.count || 0,
        users: usersRes.count || 0,
        enrollments: totalEnrollments,
        certificates: certificatesRes.count || 0,
        passRate,
        passedCount,
      };
    },
  });

  const { data: recentCourses } = useQuery({
    queryKey: ['admin-recent-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentEnrollments } = useQuery({
    queryKey: ['admin-recent-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, status, progress, created_at, courses(title), profiles!enrollments_user_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['admin-monthly-stats'],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        const [enrollmentsRes, certificatesRes] = await Promise.all([
          supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', start.toISOString())
            .lte('created_at', end.toISOString()),
          supabase
            .from('certificates')
            .select('id', { count: 'exact', head: true })
            .gte('issued_at', start.toISOString())
            .lte('issued_at', end.toISOString()),
        ]);

        months.push({
          month: format(date, 'MMM', { locale: ptBR }),
          fullMonth: format(date, "MMMM 'de' yyyy", { locale: ptBR }),
          enrollments: enrollmentsRes.count || 0,
          certificates: certificatesRes.count || 0,
        });
      }
      return months;
    },
  });

  const statCards = [
    {
      title: 'Total de Cursos',
      value: stats?.courses || 0,
      icon: BookOpen,
      color: 'text-primary',
      bg: 'bg-primary/10',
      href: '/admin/cursos',
    },
    {
      title: 'Alunos Cadastrados',
      value: stats?.users || 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: '/admin/usuarios',
    },
    {
      title: 'Total de Matrículas',
      value: stats?.enrollments || 0,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      href: '/admin/usuarios',
    },
    {
      title: 'Certificados Emitidos',
      value: stats?.certificates || 0,
      icon: Award,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      href: '/admin/certificados',
    },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      in_progress: { label: 'Em andamento', variant: 'secondary' },
      completed: { label: 'Concluído', variant: 'outline' },
      passed: { label: 'Aprovado', variant: 'default' },
      failed: { label: 'Reprovado', variant: 'destructive' },
    };
    const { label, variant } = config[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da plataforma
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Taxa de Aprovação</CardTitle>
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{stats?.passRate || 0}%</div>
              <p className="text-sm text-muted-foreground mt-1">
                {stats?.passedCount || 0} de {stats?.enrollments || 0} alunos aprovados
              </p>
            </div>
            <Progress value={stats?.passRate || 0} className="h-3" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Cursos Recentes</CardTitle>
            <Link to="/admin/cursos" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentCourses?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhum curso cadastrado</p>
            ) : (
              <div className="space-y-3">
                {recentCourses?.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.created_at && format(new Date(course.created_at), "dd 'de' MMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                      {course.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução de Matrículas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                enrollments: {
                  label: 'Matrículas',
                  color: 'hsl(var(--primary))',
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData || []}>
                  <defs>
                    <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth || ''}
                  />
                  <Area
                    type="monotone"
                    dataKey="enrollments"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#enrollmentGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Certificados Emitidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                certificates: {
                  label: 'Certificados',
                  color: 'hsl(var(--chart-2))',
                },
              }}
              className="h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    className="text-xs fill-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth || ''}
                  />
                  <Bar
                    dataKey="certificates"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Matrículas Recentes</CardTitle>
            <Link to="/admin/usuarios" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentEnrollments?.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma matrícula</p>
            ) : (
              <div className="space-y-3">
                {recentEnrollments?.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {(enrollment.profiles as any)?.full_name || 'Aluno'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(enrollment.courses as any)?.title || 'Curso'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {enrollment.progress}%
                      </div>
                      {getStatusBadge(enrollment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/admin/criar-curso"
              className="block p-4 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="hero-gradient p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Criar Novo Curso com IA</p>
                  <p className="text-sm text-muted-foreground">
                    Gere conteúdo automaticamente
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/categorias"
              className="block p-4 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Gerenciar Categorias</p>
                  <p className="text-sm text-muted-foreground">
                    Organize seus cursos
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/admin/certificados"
              className="block p-4 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Validar Certificados</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique certificados emitidos
                  </p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
