import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FreeCourseDisclaimerProps {
  className?: string;
}

export function FreeCourseDisclaimer({ className }: FreeCourseDisclaimerProps) {
  return (
    <div
      role="note"
      aria-label="Informações sobre o certificado e reconhecimento do curso"
      className={cn(
        'rounded-2xl border border-border/70 bg-muted/40 p-4 sm:p-5',
        'flex items-start gap-3 sm:gap-4',
        className,
      )}
    >
      <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-1.5 sm:p-2">
        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden="true" />
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        Este é um curso livre, de caráter educacional. O certificado é próprio da Formak e
        comprova a conclusão do conteúdo disponibilizado. O curso não é autorizado ou reconhecido
        pelo MEC, não equivale a diploma ou pós-graduação e não habilita para o exercício de
        profissões regulamentadas.
      </p>
    </div>
  );
}
