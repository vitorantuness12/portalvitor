import { useOfflineCourse } from '@/hooks/useOfflineCourse';
import { OfflineDownloadButton } from '@/components/courses/OfflineDownloadButton';

interface CourseOfflineButtonProps {
  courseId: string | undefined;
  compact?: boolean;
  className?: string;
}

/** Botão de download offline autocontido, para usar em listas de cursos. */
export function CourseOfflineButton({ courseId, compact, className }: CourseOfflineButtonProps) {
  const { isSaved, isSaving, savedAt, save, remove, progress, attempt } = useOfflineCourse(courseId);

  if (!courseId) return null;

  return (
    <OfflineDownloadButton
      isSaved={isSaved}
      isSaving={isSaving}
      savedAt={savedAt}
      onSave={save}
      onRemove={remove}
      progress={progress}
      attempt={attempt}
      compact={compact}
      className={className}
    />
  );
}
