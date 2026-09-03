import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HardDrive, Trash2, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { useToast } from '@/hooks/use-toast';
import {
  OfflineCourseSummary,
  clearAllOfflineCourses,
  formatBytes,
  listOfflineCourses,
  removeOfflineCourse,
} from '@/lib/offlineCourses';

export default function OfflineDownloads() {
  const { toast } = useToast();
  const [items, setItems] = useState<OfflineCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listOfflineCourses();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = items.reduce((sum, item) => sum + item.bytes, 0);

  const handleRemove = async (courseId: string) => {
    await removeOfflineCourse(courseId);
    setItems((prev) => prev.filter((i) => i.courseId !== courseId));
    toast({ title: 'Download removido', description: 'O espaço foi liberado no seu aparelho.' });
  };

  const handleClearAll = async () => {
    setClearing(true);
    await clearAllOfflineCourses();
    setItems([]);
    setClearing(false);
    toast({ title: 'Downloads apagados', description: 'Todo o conteúdo offline foi removido.' });
  };

  return (
    <PwaLayout>
      <div className="container max-w-3xl px-4 py-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Downloads offline</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie o conteúdo salvo no aparelho e libere espaço quando precisar.
          </p>
        </header>

        <Card className="rounded-2xl border-border/60">
          <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Espaço usado</p>
                <p className="text-lg font-semibold">{formatBytes(total)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={load} aria-label="Atualizar lista">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={clearing || items.length === 0}
                className="text-destructive border-destructive/40"
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Limpar tudo
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando downloads...</p>
        ) : items.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nenhum curso baixado</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Abra um curso em que você está matriculado e toque em "Baixar para offline".
              </p>
              <Button asChild size="sm">
                <Link to="/meus-cursos">Ver meus cursos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.courseId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className="rounded-2xl border-border/60">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{formatBytes(item.bytes)}</Badge>
                        <span>{item.moduleCount} módulos</span>
                        <span>
                          Atualizado em{' '}
                          {new Date(item.savedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/curso/${item.courseId}/estudar`}>Abrir</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.courseId)}
                        aria-label={`Remover download de ${item.title}`}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PwaLayout>
  );
}
