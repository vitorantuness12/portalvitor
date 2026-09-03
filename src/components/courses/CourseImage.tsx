import { useCourseThumbnail } from '@/lib/storageImage';

interface CourseImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** URL salva no banco (pública, assinada ou externa). */
  thumbnailUrl?: string | null;
  /** Imagem exibida quando não há capa válida. */
  fallbackSrc?: string;
  alt: string;
}

/**
 * <img> que resolve automaticamente capas guardadas em bucket privado do Supabase.
 */
export function CourseImage({ thumbnailUrl, fallbackSrc, alt, ...props }: CourseImageProps) {
  const resolved = useCourseThumbnail(thumbnailUrl);
  const src = resolved || fallbackSrc;

  if (!src) return null;

  return <img src={src} alt={alt} loading="lazy" decoding="async" {...props} />;
}
