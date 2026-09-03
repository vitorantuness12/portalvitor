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
  save: () => Promise<boolean>;
  remove: () => Promise<void>;
}

/**
 * Gerencia o download/remoção do conteúdo de um curso para uso offline.
 */
export function useOfflineCourse(courseId: string | undefined): UseOfflineCourseResult {
  const [offlineData, setOfflineData] = useState<OfflineCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const save = useCallback(async () => {
    if (!courseId) return false;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, level, duration_hours, content_pdf_url')
        .eq('id', courseId)
        .single();

      if (error || !data) throw error ?? new Error('Curso não encontrado');

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

      await saveOfflineCourse(payload);
      setOfflineData(payload);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [courseId]);

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
    save,
    remove,
  };
}
