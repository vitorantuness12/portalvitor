import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { buildCourseTxt, saveCourseTxt } from '@/lib/courseTxt';

interface CourseListItem {
  id: string;
  title: string;
  status: 'active' | 'inactive';
  categories: { name: string } | null;
}

const PAGE_SIZE = 500;

export default function CourseTextDownloads() {
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: courses = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-course-text-list'],
    queryFn: async (): Promise<CourseListItem[]> => {
      const results: CourseListItem[] = [];
      for (let page = 0; ; page += 1) {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, status, categories(name)')
          .order('title', { ascending: true })
          .order('id', { ascending: true })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (error) throw error;
        results.push(...(data ?? []));
        if (!data || data.length < PAGE_SIZE) break;
      }
      return results;
    },
  });

  const filteredCourses = courses.filter((course) =>
    course.title.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))
  );

  const download = async (course: CourseListItem) => {
    if (downloadingId) return;
    setDownloadingId(course.id);
    try {
      // Busca o conteúdo atualizado apenas quando o administrador solicita o arquivo.
      const { data, error } = await supabase
        .from('courses')
        .select('title, content_pdf_url')
        .eq('id', course.id)
        .single();
      if (error) throw error;
      const text = buildCourseTxt(data.title, data.content_pdf_url);
      saveCourseTxt(course.id, data.title, text);
      toast.success('Conteúdo em TXT baixado.');
    } catch (error) {
      toast.error(error instanceof Error && !('code' in error)
        ? error.message
        : 'Não foi possível baixar o conteúdo deste curso. Tente novamente.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Conteúdo em TXT</h1>
        <p className="text-muted-foreground">Baixe o conteúdo teórico dos cursos em texto.</p>
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar cursos"
          placeholder="Buscar cursos..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground" role="status">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Carregando cursos...
        </div>
      ) : isError ? (
        <div className="flex items-center gap-3 py-8 text-muted-foreground" role="alert">
          Não foi possível carregar os cursos.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <p className="py-8 text-muted-foreground">Nenhum curso encontrado.</p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {filteredCourses.map((course) => (
            <div key={course.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground break-words">{course.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{course.categories?.name ?? 'Sem categoria'}</span>
                    <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                      {course.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
                disabled={downloadingId !== null}
                onClick={() => void download(course)}
                aria-label={`Baixar conteúdo em TXT de ${course.title}`}
              >
                {downloadingId === course.id ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
                {downloadingId === course.id ? 'Baixando...' : 'Baixar TXT'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}