import { Check, Plus } from 'lucide-react';
import { CourseImage } from '@/components/courses/CourseImage';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface CheckoutCourseOption {
  id: string;
  title: string;
  price: number;
  thumbnailUrl: string | null;
}

interface CheckoutCourseSuggestionsProps {
  courses: CheckoutCourseOption[];
  selectedIds: string[];
  isLoading: boolean;
  onToggle: (courseId: string) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

export function CheckoutCourseSuggestions({
  courses,
  selectedIds,
  isLoading,
  onToggle,
}: CheckoutCourseSuggestionsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={`checkout-suggestion-${index}`} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!courses.length) return null;

  return (
    <section className="space-y-3" aria-labelledby="checkout-suggestions-title">
      <div>
        <h3 id="checkout-suggestions-title" className="font-display text-base font-semibold text-foreground">
          Aproveite e adicione à compra
        </h3>
        <p className="text-xs text-muted-foreground">Cursos da mesma categoria com os menores preços.</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {courses.map((course) => {
          const selected = selectedIds.includes(course.id);
          return (
            <article
              key={course.id}
              className={cn(
                'flex min-h-20 items-center gap-3 rounded-lg border p-2 transition-colors',
                selected ? 'border-primary bg-primary/5' : 'border-border bg-card',
              )}
            >
              <CourseImage
                thumbnailUrl={course.thumbnailUrl}
                alt=""
                className="h-14 w-20 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-semibold text-foreground">{course.title}</p>
                <p className="mt-1 text-sm font-bold text-primary">{formatPrice(course.price)}</p>
              </div>
              <Button
                type="button"
                variant={selected ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => onToggle(course.id)}
                aria-label={selected ? `Remover ${course.title}` : `Adicionar ${course.title}`}
              >
                {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}