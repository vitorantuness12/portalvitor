import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  short_description: string | null;
  duration_hours: number;
  thumbnail_url: string | null;
  level: string;
}

interface OnboardingStep2Props {
  courses: Course[];
  enrolledCourses: string[];
  onEnroll: (courseId: string) => void;
  onNext: () => void;
  isLoading: boolean;
  enrollingCourseId: string | null;
}

export function OnboardingStep2({
  courses,
  enrolledCourses,
  onEnroll,
  onNext,
  isLoading,
  enrollingCourseId,
}: OnboardingStep2Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col items-center text-center px-4 w-full"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 sm:mb-6"
      >
        <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-green-500" />
      </motion.div>

      <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold mb-2">
        Cursos Gratuitos Para Você! 🎉
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md px-2">
        Encontramos estes cursos gratuitos baseados nos seus interesses. Inscreva-se agora e comece a aprender!
      </p>

      {isLoading ? (
        <div className="grid gap-3 sm:gap-4 w-full max-w-2xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 sm:h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4 bg-muted/50 rounded-xl w-full max-w-2xl">
          <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-muted-foreground">
            Não encontramos cursos gratuitos nas categorias selecionadas no momento.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Explore nosso catálogo completo após o onboarding!
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 w-full max-w-2xl">
          {courses.map((course, index) => {
            const isEnrolled = enrolledCourses.includes(course.id);
            const isEnrolling = enrollingCourseId === course.id;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex flex-col gap-3 p-3 sm:p-4 rounded-xl border-2 text-left transition-all",
                  isEnrolled
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {/* Mobile: Stack layout / Desktop: Row layout */}
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0 h-16 w-16 sm:h-24 sm:w-32 rounded-lg overflow-hidden bg-muted">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{course.title}</h3>
                      <Badge variant="secondary" className="flex-shrink-0 text-xs">
                        Grátis
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 hidden sm:block">
                      {course.short_description || 'Curso gratuito disponível para você'}
                    </p>
                    
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration_hours}h
                      </span>
                      <span className="capitalize">{course.level}</span>
                    </div>
                  </div>
                </div>

                {/* Action button - full width on mobile */}
                <Button
                  size="sm"
                  variant={isEnrolled ? "outline" : "default"}
                  onClick={() => !isEnrolled && onEnroll(course.id)}
                  disabled={isEnrolled || isEnrolling}
                  className={cn(
                    "w-full sm:w-auto sm:self-end",
                    isEnrolled && "border-primary text-primary"
                  )}
                >
                  {isEnrolling ? (
                    "Inscrevendo..."
                  ) : isEnrolled ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Inscrito
                    </>
                  ) : (
                    "Inscrever-se"
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 sm:mt-8 w-full max-w-sm px-2">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={onNext}
        >
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
