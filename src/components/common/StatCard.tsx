import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  hint?: string;
  /** Tonalidade do ícone — usa apenas tokens semânticos. */
  tone?: 'primary' | 'success' | 'warning' | 'info';
  className?: string;
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

/** Card de métrica compacto e consistente entre dashboards. */
export function StatCard({ label, value, icon: Icon, hint, tone = 'primary', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/70 bg-card p-4 shadow-soft transition-shadow duration-300 hover:shadow-elevated sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', toneClasses[tone])}>
            <Icon className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
