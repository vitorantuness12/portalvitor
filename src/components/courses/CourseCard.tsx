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
        {isEnrolled && (
          <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
            Matriculado
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {shortDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {durationHours}h
          </span>
          <Badge variant="outline" className={levelColors[level] || ''}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xl font-bold text-primary">
            {formatPrice(price)}
          </span>
          <Link to={`/curso/${id}`}>
            <Button variant={isEnrolled ? 'secondary' : 'hero'} size="sm">
              {isEnrolled ? 'Acessar' : 'Ver Curso'}
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
