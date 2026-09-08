import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

/** IDs dos cursos da área de Saúde que exibem o aviso educacional. */
export const HEALTH_DISCLAIMER_COURSE_IDS: readonly string[] = [
  '24d66af7-1ecc-470e-845b-10ea9ac611a5', // Guia Dieta Carnívora
  '5bc5ade3-acf2-4051-96b4-90209724576b', // Fitoterapia
  '592f2538-1fd4-4674-803c-63db1309b8af', // Gestão de Doenças Crônicas
  'f957e1e7-5ae5-43fd-91eb-dcb1f5ae0dd3', // Terapias Complementares
  '4a4ff17d-7af1-4ea4-94b6-d499c5f3e765', // Nutrição Esportiva
  '59d70636-e9cf-4046-92a0-7ef62681c498', // Nutrição Baseada em Plantas
  '44296e39-9eca-4c97-a23d-fe2dabe6011c', // Coaching de Saúde
  '56e3cb40-62b2-4c63-a6a5-627bc6650726', // Atendentes de Farmácia
];

export function hasHealthDisclaimer(courseId?: string | null): boolean {
  return !!courseId && HEALTH_DISCLAIMER_COURSE_IDS.includes(courseId);
}

export interface HealthDisclaimerProps {
  className?: string;
  /** Versão compacta para barras fixas em mobile. */
  compact?: boolean;
}

export const HEALTH_DISCLAIMER_TEXT =
  'Este curso tem finalidade exclusivamente educacional. Não oferece consulta, diagnóstico, prescrição, tratamento ou acompanhamento individual. O certificado não habilita o aluno a exercer profissão da área da saúde. As informações apresentadas não devem ser utilizadas para iniciar, interromper ou alterar tratamentos. Para orientação individual, procure um profissional de saúde habilitado.';

export const HealthDisclaimer = ({ className, compact = false }: HealthDisclaimerProps) => (
  <div
    role="note"
    aria-label="Aviso de saúde"
    className={cn(
      'rounded-xl border-l-4 border-info bg-info/10',
      compact ? 'p-2.5 text-xs' : 'p-4 text-sm',
      className
    )}
  >
    <div className={cn('flex items-start', compact ? 'gap-2' : 'gap-3')}>
      <HeartPulse
        className={cn('text-info flex-shrink-0 mt-0.5', compact ? 'h-4 w-4' : 'h-5 w-5')}
        aria-hidden="true"
      />
      <div>
        <p className={cn('font-semibold text-info-foreground', compact ? 'mb-0.5' : 'mb-1')}>
          Aviso de saúde
        </p>
        <p className="text-info-foreground/90 leading-relaxed">{HEALTH_DISCLAIMER_TEXT}</p>
      </div>
    </div>
  </div>
);

export default HealthDisclaimer;
