import { motion } from 'framer-motion';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [coursesRes, usersRes, enrollmentsRes, certificatesRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
      ]);

      return {
        courses: coursesRes.count || 0,
        users: usersRes.count || 0,
        enrollments: enrollmentsRes.count || 0,
        certificates: certificatesRes.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: 'Total de Cursos',
      value: stats?.courses || 0,
      icon: BookOpen,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Usuários Cadastrados',
      value: stats?.users || 0,
      icon: Users,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      title: 'Matrículas',
      value: stats?.enrollments || 0,
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Certificados Emitidos',
      value: stats?.certificates || 0,
      icon: Award,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

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
            <Card>
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
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo ao Painel Administrativo</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              Aqui você pode gerenciar todos os aspectos da plataforma:
            </p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Criar e gerenciar cursos com IA
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Administrar usuários e permissões
              </li>
              <li className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Visualizar certificados emitidos
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/admin/criar-curso"
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
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
