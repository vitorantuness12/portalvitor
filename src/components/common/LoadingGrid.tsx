import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LoadingGridProps {
  /** Quantidade de placeholders exibidos. */
  count?: number;
  className?: string;
  /** Altura da área de mídia do card placeholder. */
  mediaClassName?: string;
}

/**
 * Skeleton de listagem em grade — mantém o mesmo ritmo visual do conteúdo
 * final para evitar saltos de layout (CLS) durante o carregamento.
 */
export function LoadingGrid({ count = 6, className, mediaClassName = 'aspect-video' }: LoadingGridProps) {
  return (
    <div
      role="status"
      aria-label="Carregando conteúdo"
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5', className)}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <Skeleton className={cn('w-full rounded-none', mediaClassName)} />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
