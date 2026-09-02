import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 sm:items-end">
      <span className="text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
        Passo {currentStep} de {totalSteps}
      </span>
      <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.8 }}
            animate={{
              scale: currentStep === index + 1 ? 1.2 : 1,
            }}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              currentStep === index + 1
                ? 'w-8 bg-primary'
                : currentStep > index + 1
                  ? 'w-2 bg-primary/60'
                  : 'w-2 bg-muted-foreground/30'
            )}
          />
        ))}
      </div>
    </div>
  );
}
