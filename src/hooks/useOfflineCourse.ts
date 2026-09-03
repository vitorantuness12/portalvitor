import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  OFFLINE_VERSION,
  OfflineCourse,
  OfflineModule,
  getOfflineCourse,
  removeOfflineCourse,
  saveOfflineCourse,
} from '@/lib/offlineCourses';

function parseModules(raw: string | null | undefined): OfflineModule[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && typeof m === 'object')
      .map((m) => ({
        title: String(m.title ?? ''),
        content: String(m.content ?? ''),
      }));
  } catch {
    return [];
  }
}

interface UseOfflineCourseResult {
  offlineData: OfflineCourse | null;
  isSaved: boolean;
  savedAt: string | null;
  isLoading: boolean;
  isSaving: boolean;
  /** 0-100 durante o download */
  progress: number;
  /** Tentativa atual (1..MAX_ATTEMPTS) quando há retentativa */
  attempt: number;
  save: () => Promise<boolean>;
  remove: () => Promise<void>;
}

const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gerencia o download/remoção do conteúdo de um curso para uso offline.
 * Inclui progresso, retentativas com backoff e sincronização automática
 * quando a internet volta.
 */
export function useOfflineCourse(courseId: string | undefined): UseOfflineCourseResult {
  const [offlineData, setOfflineData] = useState<OfflineCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    if (!courseId) {
      setOfflineData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getOfflineCourse(courseId).then((data) => {
      if (!active) return;
      setOfflineData(data);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [courseId]);

  const fetchAndStore = useCallback(async (): Promise<boolean> => {
    if (!courseId) return false;
    setProgress(10);
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, level, duration_hours, content_pdf_url')
      .eq('id', courseId)
      .single();

    if (error || !data) throw error ?? new Error('Curso não encontrado');
    setProgress(60);

    const modules = parseModules(data.content_pdf_url);
    if (modules.length === 0) return false;

    const payload: OfflineCourse = {
      courseId,
      title: data.title,
      description: data.description ?? '',
      level: data.level ?? '',
      durationHours: data.duration_hours ?? 0,
      modules,
      savedAt: new Date().toISOString(),
      version: OFFLINE_VERSION,
    };

    setProgress(85);
    await saveOfflineCourse(payload);
    setOfflineData(payload);
    setProgress(100);
    return true;
  }, [courseId]);

  const save = useCallback(async () => {
    if (!courseId) return false;
    setIsSaving(true);
    setProgress(0);
    try {
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        setAttempt(i);
        try {
          return await fetchAndStore();
        } catch {
          if (i === MAX_ATTEMPTS) return false;
          // Backoff exponencial simples entre as tentativas
          await sleep(800 * i);
        }
      }
      return false;
    } finally {
      setIsSaving(false);
      setAttempt(0);
      setTimeout(() => setProgress(0), 600);
    }
  }, [courseId, fetchAndStore]);

  // Sincronização automática: ao voltar a internet, atualiza o conteúdo salvo.
  useEffect(() => {
    if (!courseId) return;
    const onOnline = () => {
      if (!offlineData) return;
      void save();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [courseId, offlineData, save]);

  const remove = useCallback(async () => {
    if (!courseId) return;
    await removeOfflineCourse(courseId);
    setOfflineData(null);
  }, [courseId]);

  return {
    offlineData,
    isSaved: !!offlineData,
    savedAt: offlineData?.savedAt ?? null,
    isLoading,
    isSaving,
    progress,
    attempt,
    save,
    remove,
  };
}

