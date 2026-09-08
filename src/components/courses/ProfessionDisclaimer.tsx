import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

/** IDs dos cursos com nomes de profissões que exibem o aviso de formação livre. */
export const PROFESSION_DISCLAIMER_COURSE_IDS: readonly string[] = [
  '368e957d-5636-4041-9509-b2d1525561b6', // Garçom
  '921424e5-c991-45a5-b68c-4139ddc765fa', // Frentista
  'c183e535-94d4-4b20-9871-8896ed8b826c', // Síndico Profissional
  '55605cfd-15e2-4e61-b697-7a11c9e50f2e', // Operador de Caixa
  'a5a3a865-2de2-4987-b8d2-08c85fa5d06f', // Almoxarife
  '614690b2-0bd8-441b-a31c-bc55df04f639', // Auxiliar Administrativo
  '56e3cb40-62b2-4c63-a6a5-627bc6650726', // Atendentes de Farmácia
  'fdc95a95-9089-4470-8cff-e5b1768aa292', // Psicopedagogia
  '696fa090-ecbb-423e-af89-884f7399f92f', // Educação Especial
  'dfce6e7c-791f-48ec-a575-64447c14aaaa', // Pedagogia Hospitalar e Ensino Domiciliar
  'bb9fbc3d-83fe-4a55-9904-d7168b77316a', // Pedagogia Inclusiva
];

/** Curso de Atendente de Farmácia recebe um aviso adicional específico. */
export const PHARMACY_COURSE_ID = '56e3cb40-62b2-4c63-a6a5-627bc6650726';

export function hasProfessionDisclaimer(courseId?: string | null): boolean {
  return !!courseId && PROFESSION_DISCLAIMER_COURSE_IDS.includes(courseId);
}

export interface ProfessionDisclaimerProps {
  className?: string;
  /** Versão compacta para barras fixas em mobile. */
  compact?: boolean;
  /** ID do curso, para exibir observações específicas (ex.: farmácia). */
  courseId?: string | null;
}

export const PROFESSION_DISCLAIMER_TEXT =
  'Este curso é uma formação livre e introdutória. O certificado não constitui habilitação profissional, registro, licença ou autorização para exercício de atividade regulamentada.';

export const PHARMACY_DISCLAIMER_TEXT =
  'O curso não habilita o aluno a atuar como farmacêutico, dispensar medicamentos sob responsabilidade própria, realizar diagnóstico ou substituir a formação e a supervisão exigidas para atividades em estabelecimentos de saúde.';

export const ProfessionDisclaimer = ({ className, compact = false, courseId }: ProfessionDisclaimerProps) => (
  <div
    role="note"
    aria-label="Aviso sobre formação livre"
    className={cn(
      'rounded-xl border-l-4 border-info bg-info/10',
      compact ? 'p-2.5 text-xs' : 'p-4 text-sm',
      className
    )}
  >
    <div className={cn('flex items-start', compact ? 'gap-2' : 'gap-3')}>
      <Briefcase
        className={cn('text-info flex-shrink-0 mt-0.5', compact ? 'h-4 w-4' : 'h-5 w-5')}
        aria-hidden="true"
      />
      <div>
        <p className={cn('font-semibold text-info-foreground', compact ? 'mb-0.5' : 'mb-1')}>
          Formação livre e introdutória
        </p>
        <p className="text-info-foreground/90 leading-relaxed">{PROFESSION_DISCLAIMER_TEXT}</p>
        {courseId === PHARMACY_COURSE_ID && (
          <p className="text-info-foreground/90 leading-relaxed mt-2">{PHARMACY_DISCLAIMER_TEXT}</p>
        )}
      </div>
    </div>
  </div>
);

export default ProfessionDisclaimer;
