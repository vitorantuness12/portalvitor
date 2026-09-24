import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload as TusUpload } from 'tus-js-client';
import { Film, Loader2, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VideoCourse {
  id: string;
  title: string;
  status: 'active' | 'inactive';
  video_path: string | null;
  categories: { name: string } | null;
}

const PAGE_SIZE = 500;
const VIDEO_TYPES: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm' };
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export default function CourseVideos() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const uploadRef = useRef<TusUpload | null>(null);
  const rejectUploadRef = useRef<((reason: Error) => void) | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-course-videos'],
    queryFn: async (): Promise<VideoCourse[]> => {
      const results: VideoCourse[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await supabase.from('courses')
          .select('id, title, status, video_path, categories(name)')
          .order('title', { ascending: true }).order('id', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (error) throw error;
        results.push(...(data ?? []));
        if (!data || data.length < PAGE_SIZE) break;
      }
      return results;
    },
  });

  const course = courses.find((item) => item.id === selectedId);
  const filtered = courses.filter((item) => item.title.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')));

  useEffect(() => () => {
    void uploadRef.current?.abort();
    rejectUploadRef.current?.(new Error('Envio interrompido.'));
  }, []);

  const refreshCourses = async (courseId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-course-videos'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] }),
      queryClient.invalidateQueries({ queryKey: ['course', courseId] }),
      queryClient.invalidateQueries({ queryKey: ['course-video-url', courseId] }),
    ]);
  };

  const startUpload = async (file: File) => {
    if (!course || uploading || removing) return;
    const extension = VIDEO_TYPES[file.type] ?? (file.name.toLowerCase().endsWith('.mp4') ? 'mp4' : file.name.toLowerCase().endsWith('.webm') ? 'webm' : undefined);
    if (!extension || file.size === 0 || file.size > MAX_VIDEO_BYTES) {
      toast.error('Envie um MP4 ou WebM de até 500 MB.');
      return;
    }

    const courseId = course.id;
    const previousPath = course.video_path;
    const contentType = extension === 'mp4' ? 'video/mp4' : 'video/webm';
    // A unique path keeps the old video playable until the new upload and database update succeed.
    const path = `${courseId}/${crypto.randomUUID()}.${extension}`;
    let uploadCompleted = false;
    let courseUpdated = false;
    setUploading(true);
    setProgress(0);

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) throw new Error('Entre novamente na sua conta para enviar o vídeo.');
      await new Promise<void>((resolve, reject) => {
        rejectUploadRef.current = reject;
        const upload = new TusUpload(file, {
          endpoint: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`,
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          onBeforeRequest: async (request) => {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) throw new Error('Sua sessão expirou. Entre novamente para enviar o vídeo.');
            request.setHeader('authorization', `Bearer ${data.session.access_token}`);
          },
          uploadDataDuringCreation: true,
          storeFingerprintForResuming: false,
          chunkSize: 6 * 1024 * 1024,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          metadata: { bucketName: 'course-videos', objectName: path, contentType, cacheControl: '3600' },
          onProgress: (sent, total) => setProgress(Math.round(sent / total * 100)),
          onError: reject,
          onSuccess: () => resolve(),
        });
        uploadRef.current = upload;
        upload.start();
      });
      uploadCompleted = true;

      const update = supabase.from('courses').update({ video_path: path })
        .eq('id', courseId);
      const { data, error } = await (previousPath ? update.eq('video_path', previousPath) : update.is('video_path', null))
        .select('id').maybeSingle();
      if (error || !data) {
        throw error ?? new Error('O vídeo do curso mudou durante o envio. Atualize e tente novamente.');
      }
      courseUpdated = true;
      await refreshCourses(courseId);
      if (previousPath) {
        const { error: cleanupError } = await supabase.storage.from('course-videos').remove([previousPath]);
        if (cleanupError) toast.warning('Novo vídeo salvo, mas não foi possível limpar o arquivo anterior.');
      }
      toast.success('Vídeo aula salvo com sucesso.');
      setSelectedId(null);
    } catch (error) {
      if (uploadCompleted && !courseUpdated) {
        await supabase.storage.from('course-videos').remove([path]);
      }
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar o vídeo. Tente novamente.');
    } finally {
      uploadRef.current = null;
      rejectUploadRef.current = null;
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeVideo = async () => {
    if (!course?.video_path || removing || uploading) return;
    const { id, video_path: path } = course;
    setRemoving(true);
    try {
      const { data, error } = await supabase.from('courses').update({ video_path: null })
        .eq('id', id).eq('video_path', path).select('id').maybeSingle();
      if (error || !data) throw error ?? new Error('O vídeo mudou. Atualize a página.');
      await refreshCourses(id);
      const { error: cleanupError } = await supabase.storage.from('course-videos').remove([path]);
      if (cleanupError) toast.warning('Vídeo removido do curso, mas o arquivo antigo ainda precisa ser limpo.');
      else toast.success('Vídeo aula removido.');
      setSelectedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível remover o vídeo.');
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Vídeo aula</h1>
        <p className="text-muted-foreground">Adicione ou atualize a vídeo aula dos cursos já criados.</p>
      </div>
      <div className="relative w-full sm:max-w-sm">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input type="search" aria-label="Buscar cursos" placeholder="Buscar cursos..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
      </div>
      {isLoading ? <p className="flex items-center gap-2 py-8 text-muted-foreground" role="status"><Loader2 className="size-5 animate-spin" /> Carregando cursos...</p>
        : isError ? <div role="alert" className="flex items-center gap-3 py-8">Não foi possível carregar os cursos. <Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div>
          : filtered.length === 0 ? <p className="py-8 text-muted-foreground">Nenhum curso encontrado.</p>
            : <div className="divide-y divide-border border-y border-border">{filtered.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                <div className="flex min-w-0 items-start gap-3">
                  <Film className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0"><p className="font-medium text-foreground break-words">{item.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{item.categories?.name ?? 'Sem categoria'}</span>
                      <Badge variant={item.video_path ? 'default' : 'secondary'}>{item.video_path ? 'Com vídeo' : 'Sem vídeo'}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" onClick={() => setSelectedId(item.id)} aria-label={`${item.video_path ? 'Gerenciar' : 'Enviar'} vídeo aula de ${item.title}`}>
                  <UploadCloud aria-hidden="true" /> {item.video_path ? 'Gerenciar vídeo' : 'Enviar vídeo'}
                </Button>
              </div>
            ))}</div>}

      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open && !uploading && !removing) setSelectedId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Vídeo aula · {course?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{course?.video_path ? 'Um vídeo já está disponível para este curso. Você pode substituí-lo ou removê-lo.' : 'Este curso ainda não tem vídeo aula.'}</p>
            <p className="text-xs text-muted-foreground">Formatos MP4 ou WebM, até 500 MB. O limite de armazenamento da plataforma também se aplica.</p>
            <input ref={fileRef} type="file" accept="video/mp4,video/webm" className="sr-only" aria-label="Selecionar vídeo aula" onChange={(event) => { const file = event.target.files?.[0]; if (file) void startUpload(file); }} />
            {uploading && <div role="status" className="space-y-2"><div className="flex justify-between text-sm"><span>Enviando vídeo...</span><span>{progress}%</span></div><Progress value={progress} /></div>}
            <div className="flex flex-wrap gap-2">
              <Button disabled={uploading || removing} onClick={() => fileRef.current?.click()}><UploadCloud aria-hidden="true" />{course?.video_path ? 'Substituir vídeo' : 'Selecionar vídeo'}</Button>
              {uploading && <Button variant="outline" onClick={() => { void uploadRef.current?.abort(); rejectUploadRef.current?.(new Error('Envio interrompido.')); }}><X aria-hidden="true" /> Interromper</Button>}
              {course?.video_path && <Button variant="outline" className="text-destructive" disabled={uploading || removing} onClick={() => setConfirmRemove(true)}><Trash2 aria-hidden="true" /> Remover vídeo</Button>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover vídeo aula?</AlertDialogTitle><AlertDialogDescription>O vídeo não ficará mais disponível para os alunos deste curso. O conteúdo escrito continuará normalmente.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void removeVideo()}>Remover vídeo</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}