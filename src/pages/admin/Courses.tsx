import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Search, MoreHorizontal, Eye, Edit, Trash2, Sparkles, MessageSquare, RefreshCw, BookOpenCheck } from 'lucide-react';
import { WhatsAppBulkModal } from '@/components/admin/WhatsAppBulkModal';
import { EditCourseModal } from '@/components/admin/EditCourseModal';
import { CourseContentModal } from '@/components/admin/CourseContentModal';
import { Link, useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;

export default function AdminCourses() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [whatsAppCourse, setWhatsAppCourse] = useState<{ id: string; title: string } | null>(null);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [viewContentCourse, setViewContentCourse] = useState<Course | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Curso excluído com sucesso');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir curso');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' }) => {
      const { error } = await supabase
        .from('courses')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Status atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const handleRegenerateContent = async (courseId: string, courseTitle: string) => {
    setRegeneratingId(courseId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-course-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const raw = await response.text();
      let result: any = null;
      try {
        result = raw ? JSON.parse(raw) : null;
      } catch {
        result = null;
      }

      if (!response.ok) {
        const statusHint =
          response.status === 402
            ? 'Créditos de IA insuficientes. Adicione créditos para continuar.'
            : response.status === 429
              ? 'Limite de requisições de IA atingido. Tente novamente em alguns minutos.'
              : 'Erro ao regenerar conteúdo';

        throw new Error(result?.error || statusHint);
      }

      toast.success(`Conteúdo regenerado! ${result.modulesCount} módulos, ${result.exercisesCount} exercícios e ${result.examQuestionsCount} questões da prova.`);
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao regenerar conteúdo');
    } finally {
      setRegeneratingId(null);
    }
  };

  const filteredCourses = courses?.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Cursos</h1>
          <p className="text-muted-foreground">Gerencie todos os cursos da plataforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/criar-curso')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Criar com IA
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
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
        ) : filteredCourses?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum curso encontrado
          </div>
        ) : (
          filteredCourses?.map((course) => (
            <div key={course.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-16 w-24 object-cover rounded flex-shrink-0"
                  />
                ) : (
                  <div className="h-16 w-24 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-muted-foreground">Sem img</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium line-clamp-2">{course.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    {(course as any).categories?.name || 'Sem categoria'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{getLevelLabel(course.level)}</Badge>
                <span className="text-sm text-muted-foreground">{course.duration_hours}h</span>
                {course.price === 0 ? (
                  <Badge variant="outline" className="text-green-600">Grátis</Badge>
                ) : (
                  <span className="text-sm">R$ {course.price.toFixed(2)}</span>
                )}
                <Badge
                  variant={course.status === 'active' ? 'default' : 'secondary'}
                  className="cursor-pointer"
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: course.id,
                      status: course.status === 'active' ? 'inactive' : 'active',
                    })
                  }
                >
                  {course.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditCourse(course)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Link to={`/curso/${course.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewContentCourse(course)}
                  title="Ver conteúdo do curso"
                >
                  <BookOpenCheck className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRegenerateContent(course.id, course.title)}
                  disabled={regeneratingId === course.id}
                  title="Regenerar conteúdo dos módulos"
                >
                  <RefreshCw className={`h-4 w-4 ${regeneratingId === course.id ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWhatsAppCourse({ id: course.id, title: course.title })}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setDeleteId(course.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCourses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum curso encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="h-10 w-16 object-cover rounded"
                        />
                      ) : (
                        <div className="h-10 w-16 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">Sem img</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium line-clamp-1">{course.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {course.short_description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {(course as any).categories?.name || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getLevelLabel(course.level)}</Badge>
                  </TableCell>
                  <TableCell>{course.duration_hours}h</TableCell>
                  <TableCell>
                    {course.price === 0 ? (
                      <Badge variant="outline" className="text-green-600">Grátis</Badge>
                    ) : (
                      `R$ ${course.price.toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={course.status === 'active' ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: course.id,
                          status: course.status === 'active' ? 'inactive' : 'active',
                        })
                      }
                    >
                      {course.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditCourse(course)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/curso/${course.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewContentCourse(course)}>
                          <BookOpenCheck className="h-4 w-4 mr-2" />
                          Ver Conteúdo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setWhatsAppCourse({ id: course.id, title: course.title })}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRegenerateContent(course.id, course.title)}
                          disabled={regeneratingId === course.id}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingId === course.id ? 'animate-spin' : ''}`} />
                          {regeneratingId === course.id ? 'Regenerando...' : 'Regenerar Conteúdo'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir curso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.
              Todos os exercícios, provas e matrículas associadas serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {whatsAppCourse && (
        <WhatsAppBulkModal
          open={!!whatsAppCourse}
          onOpenChange={(open) => !open && setWhatsAppCourse(null)}
          courseId={whatsAppCourse.id}
          courseTitle={whatsAppCourse.title}
        />
      )}

      {editCourse && (
        <EditCourseModal
          open={!!editCourse}
          onOpenChange={(open) => !open && setEditCourse(null)}
          course={editCourse}
        />
      )}

      {viewContentCourse && (
        <CourseContentModal
          open={!!viewContentCourse}
          onOpenChange={(open) => !open && setViewContentCourse(null)}
          course={viewContentCourse}
        />
      )}
    </div>
  );
}
