import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  PlayCircle, 
  Trash2, 
  Activity,
  Timer,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface GenerationJob {
  id: string;
  status: string;
  topic: string;
  level: string;
  duration: number;
  content_depth: string;
  openai_model: string;
  error_message?: string;
  course_id?: string;
  progress_detail?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export default function JobsMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [resumingJobId, setResumingJobId] = useState<string | null>(null);

  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['generation-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_generation_jobs')
        .select('id,status,topic,level,duration,content_depth,openai_model,error_message,course_id,progress_detail,created_at,updated_at,completed_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as GenerationJob[];
    },
    refetchInterval: 5000,
  });

  const resumeJob = async (jobId: string) => {
    setResumingJobId(jobId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          processJob: true,
          jobId,
        }),
      });

      const result = await response.json().catch(() => ({ success: false }));
      
      if (result.success) {
        toast({
          title: 'Job retomado!',
          description: result.courseId ? 'Curso criado com sucesso.' : 'O job foi retomado.',
        });
      } else {
        toast({
          title: 'Retomada iniciada',
          description: 'O job está sendo processado em segundo plano.',
        });
      }
      
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao retomar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setResumingJobId(null);
    }
  };

  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('course_generation_jobs')
        .update({ 
          status: 'failed', 
          error_message: 'Cancelado pelo usuário',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Job cancelado' });
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('course_generation_jobs')
        .delete()
        .eq('id', jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Job removido' });
      queryClient.invalidateQueries({ queryKey: ['generation-jobs'] });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'processing':
        return <Badge className="bg-primary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processando</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeSinceUpdate = (updatedAt?: string) => {
    if (!updatedAt) return 'N/A';
    return formatDistanceToNow(new Date(updatedAt), { addSuffix: true, locale: ptBR });
  };

  const isStalled = (job: GenerationJob) => {
    if (job.status !== 'processing') return false;
    if (!job.updated_at) return false;
    const lastUpdate = new Date(job.updated_at).getTime();
    const now = Date.now();
    const threeMinutes = 3 * 60 * 1000;
    return (now - lastUpdate) > threeMinutes;
  };

  const parseProgress = (detail?: string) => {
    if (!detail) return null;
    const match = detail.match(/módulo (\d+) de (\d+)/i);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return null;
  };

  const stats = {
    total: jobs?.length || 0,
    completed: jobs?.filter(j => j.status === 'completed').length || 0,
    processing: jobs?.filter(j => j.status === 'processing').length || 0,
    failed: jobs?.filter(j => j.status === 'failed').length || 0,
    stalled: jobs?.filter(j => isStalled(j)).length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          Monitor de Jobs
        </h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie os jobs de geração de cursos com IA
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">Processando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Falharam</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-warning">{stats.stalled}</div>
            <p className="text-xs text-muted-foreground">Travados</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Jobs de Geração</CardTitle>
            <CardDescription>Últimos 50 jobs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : !jobs?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum job encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Tema</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const progress = parseProgress(job.progress_detail);
                    const stalled = isStalled(job);
                    
                    return (
                      <TableRow key={job.id} className={stalled ? 'bg-warning/10' : ''}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(job.status)}
                            {stalled && (
                              <Badge variant="outline" className="text-warning border-warning text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Travado
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="font-medium truncate">{job.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.level} • {job.duration}h • {job.content_depth}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.openai_model}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[120px]">
                            {progress ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Módulo {progress.current}/{progress.total}</span>
                                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                </div>
                                <Progress value={(progress.current / progress.total) * 100} className="h-1" />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {job.progress_detail || '-'}
                              </span>
                            )}
                            {job.error_message && (
                              <p className="text-xs text-destructive mt-1 truncate max-w-[150px]" title={job.error_message}>
                                {job.error_message}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {getTimeSinceUpdate(job.updated_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(job.status === 'processing' || job.status === 'pending') && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resumeJob(job.id)}
                                  disabled={resumingJobId === job.id}
                                >
                                  {resumingJobId === job.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <PlayCircle className="h-4 w-4" />
                                  )}
                                  <span className="ml-1 hidden sm:inline">Retomar</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => cancelJob.mutate(job.id)}
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                            {(job.status === 'completed' || job.status === 'failed') && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remover job?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. O job será removido permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteJob.mutate(job.id)}>
                                      Remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
