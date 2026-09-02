import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Circle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  index: number;
  question: string;
  options: unknown;
  selectedAnswer?: number;
  correctAnswer?: number;
  showResult?: boolean;
  disabled?: boolean;
  onAnswerChange: (answer: number) => void;
  variant?: 'exercise' | 'exam';
}

export function QuestionCard({
  index,
  question,
  options,
  selectedAnswer,
  correctAnswer,
  showResult = false,
  disabled = false,
  onAnswerChange,
  variant = 'exercise',
}: QuestionCardProps) {
  // Normaliza options: pode vir como array, string JSON ou objeto {a,b,c}
  const normalizedOptions: string[] = (() => {
    let raw: unknown = options;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        return [raw as string];
      }
    }
    if (Array.isArray(raw)) return raw.map((o) => String(o ?? ''));
    if (raw && typeof raw === 'object') {
      return Object.values(raw as Record<string, unknown>).map((o) => String(o ?? ''));
    }
    return [];
  })();

  const isCorrect = showResult && selectedAnswer === correctAnswer;
  const isWrong = showResult && selectedAnswer !== undefined && selectedAnswer !== correctAnswer;

  const getOptionState = (optIndex: number) => {
    if (!showResult) {
      return selectedAnswer === optIndex ? 'selected' : 'default';
    }
    if (optIndex === correctAnswer) return 'correct';
    if (selectedAnswer === optIndex && optIndex !== correctAnswer) return 'wrong';
    return 'default';
  };

  const optionStyles = {
    default: 'border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5',
    selected: 'border-primary bg-primary/10 ring-2 ring-primary/20',
    correct: 'border-success bg-success/10',
    wrong: 'border-destructive bg-destructive/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
        showResult
          ? isCorrect
            ? 'border-success/50 bg-gradient-to-br from-success/5 to-transparent shadow-lg shadow-success/10'
            : isWrong
              ? 'border-destructive/50 bg-gradient-to-br from-destructive/5 to-transparent shadow-lg shadow-destructive/10'
              : 'border-border bg-card'
          : 'border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'
      )}
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Header */}
      <div className="relative p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Question number */}
          <div className={cn(
            'flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-lg sm:text-xl transition-colors',
            showResult
              ? isCorrect
                ? 'bg-success text-success-foreground'
                : isWrong
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-primary/10 text-primary'
              : variant === 'exam'
                ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                : 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25'
          )}>
            {index + 1}
          </div>
          
          {/* Question text */}
          <div className="flex-1 min-w-0">
            <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
              {question}
            </p>
          </div>

          {/* Result indicator */}
          {showResult && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="flex-shrink-0"
            >
              {isCorrect ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success-foreground" />
                </div>
              ) : isWrong ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-destructive flex items-center justify-center">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive-foreground" />
                </div>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="relative px-4 sm:px-6 pb-4 sm:pb-6">
        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(value) => onAnswerChange(parseInt(value))}
          disabled={disabled}
          className="grid gap-2 sm:gap-3"
        >
          {normalizedOptions.map((option, optIndex) => {
            const state = getOptionState(optIndex);
            const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D...
            
            return (
              <motion.div
                key={optIndex}
                whileHover={!disabled ? { scale: 1.01 } : undefined}
                whileTap={!disabled ? { scale: 0.99 } : undefined}
              >
                <Label
                  htmlFor={`q-${index}-${optIndex}`}
                  className={cn(
                    'flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                    optionStyles[state],
                    disabled && 'cursor-default'
                  )}
                >
                  {/* Option letter badge */}
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-semibold text-sm transition-colors',
                    state === 'selected' && 'bg-primary text-primary-foreground',
                    state === 'correct' && 'bg-success text-success-foreground',
                    state === 'wrong' && 'bg-destructive text-destructive-foreground',
                    state === 'default' && 'bg-muted text-muted-foreground'
                  )}>
                    {optionLetter}
                  </div>

                  {/* Option text */}
                  <span className="flex-1 text-sm sm:text-base">
                    {option}
                  </span>

                  {/* Radio indicator */}
                  <div className="flex-shrink-0">
                    {state === 'correct' ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : state === 'wrong' ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <RadioGroupItem
                        value={optIndex.toString()}
                        id={`q-${index}-${optIndex}`}
                        className={cn(
                          'border-2',
                          state === 'selected' && 'border-primary text-primary'
                        )}
                      />
                    )}
                  </div>
                </Label>
              </motion.div>
            );
          })}
        </RadioGroup>
      </div>
    </motion.div>
  );
}
