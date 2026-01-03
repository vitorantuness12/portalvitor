import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, BookOpen, GraduationCap, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserWithEnrollments {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  enrollments: {
    id: string;
    course_id: string;
    progress: number;
    status: string;
    exam_score: number | null;
    created_at: string;
    course: {
      title: string;
    };
  }[];
}

interface Course {
  id: string;
  title: string;
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithEnrollments | null>(null);
  const [enrollUserModal, setEnrollUserModal] = useState<UserWithEnrollments | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*, courses(title)');

      if (enrollmentsError) throw enrollmentsError;

      const usersWithEnrollments: UserWithEnrollments[] = profiles.map((profile) => ({
        ...profile,
        enrollments: enrollments
          .filter((e) => e.user_id === profile.user_id)
          .map((e) => ({
            id: e.id,
            course_id: e.course_id,
            progress: e.progress,
            status: e.status,
            exam_score: e.exam_score,
            created_at: e.created_at || '',
            course: {
              title: (e.courses as any)?.title || 'Curso não encontrado',
            },
          })),
      }));

      return usersWithEnrollments;
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('status', 'active')
        .order('title');

      if (error) throw error;
      return data as Course[];
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          status: 'in_progress',
          progress: 0,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Curso adicionado com sucesso!');
      setEnrollUserModal(null);
      setSelectedCourseId('');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Usuário já está matriculado neste curso');
      } else {
        toast.error('Erro ao adicionar curso');
      }
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Matrícula removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover matrícula');
    },
  });

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      in_progress: { label: 'Em andamento', variant: 'secondary' },
      completed: { label: 'Concluído', variant: 'outline' },
      passed: { label: 'Aprovado', variant: 'default' },
      failed: { label: 'Reprovado', variant: 'destructive' },
    };
    const config = variants[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAvailableCourses = (user: UserWithEnrollments) => {
    const enrolledCourseIds = user.enrollments.map((e) => e.course_id);
    return courses?.filter((c) => !enrolledCourseIds.includes(c.id)) || [];
  };

  const handleEnroll = () => {
    if (!enrollUserModal || !selectedCourseId) return;
    enrollMutation.mutate({
      userId: enrollUserModal.user_id,
      courseId: selectedCourseId,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os alunos e acompanhe seu progresso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{users?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Total de alunos</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BookOpen className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users?.reduce((acc, u) => acc + u.enrollments.length, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Total de matrículas</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <GraduationCap className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {users?.reduce(
                  (acc, u) => acc + u.enrollments.filter((e) => e.status === 'passed').length,
                  0
                ) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Cursos concluídos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          filteredUsers?.map((user) => {
            const avgProgress =
              user.enrollments.length > 0
                ? Math.round(
                    user.enrollments.reduce((acc, e) => acc + e.progress, 0) /
                      user.enrollments.length
                  )
                : 0;

            return (
              <div key={user.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEnrollUserModal(user)}
                      title="Adicionar curso"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedUser(user)}
                      disabled={user.enrollments.length === 0}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{user.enrollments.length} curso(s)</Badge>
                  <span className="text-xs text-muted-foreground">
                    {user.created_at
                      ? format(new Date(user.created_at), "dd/MM/yyyy", { locale: ptBR })
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={avgProgress} className="h-2 flex-1" />
                  <span className="text-sm text-muted-foreground">{avgProgress}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Cursos Matriculados</TableHead>
              <TableHead>Progresso Médio</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => {
                const avgProgress =
                  user.enrollments.length > 0
                    ? Math.round(
                        user.enrollments.reduce((acc, e) => acc + e.progress, 0) /
                          user.enrollments.length
                      )
                    : 0;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.enrollments.length} curso(s)</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-32">
                        <Progress value={avgProgress} className="h-2" />
                        <span className="text-sm text-muted-foreground">{avgProgress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.created_at
                        ? format(new Date(user.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEnrollUserModal(user)}
                          title="Adicionar curso"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                          disabled={user.enrollments.length === 0}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Detalhes do Aluno */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Aluno</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Cursos Matriculados</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(null);
                      setEnrollUserModal(selectedUser);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Curso
                  </Button>
                </div>
                <div className="space-y-3">
                  {selectedUser.enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{enrollment.course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Matriculado em{' '}
                            {format(new Date(enrollment.created_at), "dd 'de' MMM, yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(enrollment.status)}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeEnrollmentMutation.mutate(enrollment.id)}
                            disabled={removeEnrollmentMutation.isPending}
                            title="Remover matrícula"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={enrollment.progress} className="h-2 flex-1" />
                        <span className="text-sm text-muted-foreground w-12">
                          {enrollment.progress}%
                        </span>
                      </div>
                      {enrollment.exam_score !== null && (
                        <p className="text-sm">
                          Nota da prova:{' '}
                          <span
                            className={
                              enrollment.exam_score >= 7
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {enrollment.exam_score.toFixed(1)}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Curso */}
      <Dialog open={!!enrollUserModal} onOpenChange={() => {
        setEnrollUserModal(null);
        setSelectedCourseId('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Curso ao Usuário</DialogTitle>
          </DialogHeader>
          {enrollUserModal && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="font-medium">{enrollUserModal.full_name}</p>
                <p className="text-sm text-muted-foreground">{enrollUserModal.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Selecione o curso</label>
                {getAvailableCourses(enrollUserModal).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este usuário já está matriculado em todos os cursos disponíveis.
                  </p>
                ) : (
                  <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableCourses(enrollUserModal).map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEnrollUserModal(null);
                    setSelectedCourseId('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEnroll}
                  disabled={!selectedCourseId || enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? 'Adicionando...' : 'Adicionar Curso'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
