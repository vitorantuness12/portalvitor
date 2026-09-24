import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Video, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export interface CourseVideoProps {
  courseId: string;
  courseTitle: string;
  videoPath: string | null;
  online: boolean;
  active: boolean;
}

export function CourseVideo({ courseId, courseTitle, videoPath, online, active }: CourseVideoProps) {
  const [playbackError, setPlaybackError] = useState(false);
  const { data: url, isLoading, isError, refetch } = useQuery({
    queryKey: ['course-video-url', courseId, videoPath],
    queryFn: async () => {
      if (!videoPath?.startsWith(`${courseId}/`)) throw new Error('Vídeo inválido para este curso.');
      const { data, error } = await supabase.storage.from('course-videos').createSignedUrl(videoPath, 86400);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: active && online && !!videoPath,
    staleTime: 23 * 60 * 60 * 1000,
    retry: false,
  });

  if (!videoPath || !online) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 border-y border-border py-10 text-center">
        {online ? <Video className="size-9 text-muted-foreground" aria-hidden="true" /> : <WifiOff className="size-9 text-muted-foreground" aria-hidden="true" />}
        <p className="text-sm text-muted-foreground">
          {online ? 'Vídeo aula ainda não disponível para este curso.' : 'A vídeo aula precisa de internet. O conteúdo escrito baixado continua disponível offline.'}
        </p>
      </div>
    );
  }

  if (isLoading) return <div role="status" className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Carregando vídeo aula...</div>;
  if (isError || !url || playbackError) return <div role="alert" className="flex items-center gap-3 py-10 text-sm text-muted-foreground">Não foi possível carregar o vídeo aula. <Button size="sm" variant="outline" onClick={() => { setPlaybackError(false); void refetch(); }}>Tentar novamente</Button></div>;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Vídeo aula</h2>
      <video
        key={url}
        controls
        playsInline
        preload="metadata"
        controlsList="nodownload"
        className="aspect-video w-full bg-foreground"
        aria-label={`Vídeo aula de ${courseTitle}`}
        onError={() => setPlaybackError(true)}
      >
        <source src={url} type={videoPath.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
        Seu navegador não consegue reproduzir este vídeo.
      </video>
    </div>
  );
}