import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, BarChart3, CheckCircle2, ImageOff, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCourseThumbnail } from '@/lib/storageImage';

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

const levelLabels: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

function Thumbnail({
  thumbnailUrl,
  title,
  aspect = 'aspect-video',
}: {
  thumbnailUrl?: string;
  title: string;
  aspect?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const resolvedUrl = useCourseThumbnail(thumbnailUrl);
  const failed = Boolean(resolvedUrl && failedUrl === resolvedUrl);

  if (!resolvedUrl || failed) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-muted', aspect)}>
        <ImageOff className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={title}
      loading="lazy"
      decoding="async"
      onLoad={() => setFailedUrl(null)}
      onError={() => setFailedUrl(resolvedUrl)}
      className={cn(
        'h-full w-full object-cover text-transparent transition-transform duration-300 group-hover:scale-105',
        aspect,
      )}
    />
  );
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
  const formatPrice = (value: number) => {
    if (value === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (compact) {
    return (
      <Link to={`/curso/${id}`} className="block focus-ring rounded-2xl">
        <Card interactive className="group overflow-hidden">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
            <Thumbnail thumbnailUrl={thumbnailUrl} title={title} aspect="aspect-[4/3]" />
            {price === 0 && (
              <Badge className="absolute top-2 right-2 border-0 bg-success text-success-foreground text-[10px] px-1.5 py-0.5">
                Grátis
              </Badge>
            )}
            {isEnrolled && (
              <Badge className="absolute top-2 left-2 border-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                Matriculado
              </Badge>
            )}
          </div>
          <div className="p-2.5 space-y-1.5">
            <h3 className="font-display font-semibold text-xs leading-tight line-clamp-2 text-foreground">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden="true" />
              <span>{durationHours}h</span>
              <span className="text-border">•</span>
              <span>{levelLabels[level] ?? level}</span>
            </div>
            <div className="font-display text-sm font-bold text-primary">{formatPrice(price)}</div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="h-full">
      <Card interactive className="group flex h-full flex-col overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          <Thumbnail thumbnailUrl={thumbnailUrl} title={title} />
          {categoryName && (
            <Badge className="absolute top-3 left-3 border-0 bg-background/90 text-foreground backdrop-blur-sm">
              {categoryName}
            </Badge>
          )}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {price === 0 && (
              <Badge className="gap-1 border-0 bg-success text-success-foreground shadow-elevated">
                <Gift className="h-3 w-3" aria-hidden="true" />
                Grátis
              </Badge>
            )}
            {isEnrolled && (
              <Badge className="border-0 bg-primary text-primary-foreground">Matriculado</Badge>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="space-y-1.5 sm:space-y-2">
            <h3 className="font-display font-semibold text-base leading-tight tracking-tight line-clamp-2 text-foreground transition-colors group-hover:text-primary sm:text-lg">
              {title}
            </h3>
            {shortDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2 sm:text-sm">{shortDescription}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              {durationHours}h
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              {levelLabels[level] ?? level}
            </span>
            {isEnrolled && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                Matriculado
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="font-display text-lg font-bold tracking-tight text-primary sm:text-xl">
              {formatPrice(price)}
            </span>
            <Link to={`/curso/${id}`}>
              <Button variant={isEnrolled ? 'secondary' : 'hero'} size="sm" className="text-xs sm:text-sm">
                {isEnrolled ? 'Acessar' : 'Ver Curso'}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
