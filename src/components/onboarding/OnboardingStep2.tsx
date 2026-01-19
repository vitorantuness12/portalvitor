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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center text-center px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6"
      >
        <BookOpen className="h-8 w-8 text-green-500" />
      </motion.div>

      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
        Cursos Gratuitos Para Você! 🎉
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Encontramos estes cursos gratuitos baseados nos seus interesses. Inscreva-se agora e comece a aprender!
      </p>

      {isLoading ? (
        <div className="grid gap-4 w-full max-w-2xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 px-4 bg-muted/50 rounded-xl w-full max-w-2xl">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Não encontramos cursos gratuitos nas categorias selecionadas no momento.
            <br />
            Explore nosso catálogo completo após o onboarding!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 w-full max-w-2xl">
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
                  "flex flex-col sm:flex-row gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  isEnrolled
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div className="flex-shrink-0 h-24 sm:w-32 sm:h-24 rounded-lg overflow-hidden bg-muted">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {course.short_description || 'Curso gratuito disponível para você'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      Grátis
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration_hours}h
                      </span>
                      <span className="capitalize">{course.level}</span>
                    </div>

                    <Button
                      size="sm"
                      variant={isEnrolled ? "outline" : "default"}
                      onClick={() => !isEnrolled && onEnroll(course.id)}
                      disabled={isEnrolled || isEnrolling}
                      className={cn(isEnrolled && "border-primary text-primary")}
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
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-8 w-full max-w-sm">
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
