import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CourseCardProps {
  id: string;
  title: string;
  shortDescription?: string;
  categoryName?: string;
  price: number;
  durationHours: number;
  level: string;
  thumbnailUrl?: string;
  isEnrolled?: boolean;
  compact?: boolean;
}

export function CourseCard({
  id,
  title,
  shortDescription,
  categoryName,
  price,
  durationHours,
  level,
  thumbnailUrl,
  isEnrolled,
  compact = false,
}: CourseCardProps) {
  const levelColors: Record<string, string> = {
    iniciante: 'bg-success/10 text-success border-success/20',
    intermediario: 'bg-warning/10 text-warning border-warning/20',
    avancado: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (compact) {
    return (
      <Link to={`/curso/${id}`} className="block">
        <div className="group bg-card rounded-lg border border-border overflow-hidden">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop'}
              alt={title}
              className="w-full h-full object-cover"
            />
            {price === 0 && (
              <Badge className="absolute top-2 right-2 bg-success text-success-foreground border-0 text-[10px] px-1.5 py-0.5">
                Grátis
              </Badge>
            )}
            {isEnrolled && (
              <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground border-0 text-[10px] px-1.5 py-0.5">
                Matriculado
              </Badge>
            )}
          </div>
          <div className="p-2.5 space-y-1.5">
            <h3 className="font-display font-semibold text-xs leading-tight line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{durationHours}h</span>
              <span className="text-border">•</span>
              <span className={levelColors[level] ? 'font-medium' : ''}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </span>
            </div>
            <div className="font-display text-sm font-bold text-primary">
              {formatPrice(price)}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-card rounded-xl border border-border overflow-hidden card-elevated"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {categoryName && (
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-sm">
            {categoryName}
          </Badge>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {price === 0 && (
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg animate-pulse">
              🎁 Grátis
            </Badge>
          )}
          {isEnrolled && (
            <Badge className="bg-success text-success-foreground">
              Matriculado
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="font-display font-semibold text-base sm:text-lg leading-tight tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {shortDescription && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {shortDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {durationHours}h
          </span>
          <Badge variant="outline" className={`text-xs ${levelColors[level] || ''}`}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-primary">
            {formatPrice(price)}
          </span>
          <Link to={`/curso/${id}`}>
            <Button variant={isEnrolled ? 'secondary' : 'hero'} size="sm" className="text-xs sm:text-sm">
              {isEnrolled ? 'Acessar' : 'Ver Curso'}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
