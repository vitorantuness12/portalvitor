import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WHATSAPP_NUMBER = '5567992963871';

interface CourseDownloadActionsProps {
  courseTitle: string;
  courseDurationHours: number;
}

export function CourseDownloadActions({
  courseTitle,
  courseDurationHours,
}: CourseDownloadActionsProps) {
  const handleBuyPrinted = () => {
    const message = encodeURIComponent(
      `Olá! Tenho interesse em adquirir o conteúdo impresso do curso:\n\n📚 *${courseTitle}*\n⏱ ${courseDurationHours}h de duração\n\nPoderia me informar sobre valores e prazo de entrega?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBuyPrinted}
        className="gap-1.5"
      >
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">Comprar Conteúdo Impresso</span>
      </Button>
    </div>
  );
}
