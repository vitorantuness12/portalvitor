import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Ação principal sugerida para o usuário sair do estado vazio. */
  action?: ReactNode;
  className?: string;
  /** Usa tons de erro em vez de neutros. */
  variant?: 'default' | 'error';
}

/**
 * Estado vazio/erro padronizado — evita telas "mortas" e sempre oferece
 * um próximo passo claro ao usuário.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center sm:py-16',
        className,
      )}
    >
      {Icon && (
        <span
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
            variant === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </span>
      )}
      <h3 className="font-display text-base font-semibold text-foreground sm:text-lg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
