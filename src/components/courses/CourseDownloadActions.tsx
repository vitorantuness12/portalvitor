import { useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateCoursePdf } from './CoursePdfDocument';
import { useToast } from '@/hooks/use-toast';

const WHATSAPP_NUMBER = '5567992963871';

interface Module {
  title: string;
  content: string;
}

interface CourseDownloadActionsProps {
  courseTitle: string;
  courseDescription: string;
  courseLevel: string;
  courseDurationHours: number;
  modules: Module[];
}

export function CourseDownloadActions({
  courseTitle,
  courseDescription,
  courseLevel,
  courseDurationHours,
  modules,
}: CourseDownloadActionsProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    if (modules.length === 0) {
      toast({
        title: 'Conteúdo não disponível',
        description: 'Este curso ainda não possui conteúdo para download.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const blob = generateCoursePdf({
        title: courseTitle,
        description: courseDescription,
        level: courseLevel,
        durationHours: courseDurationHours,
        modules,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${courseTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O download do curso em PDF iniciou.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleBuyPrinted = () => {
    const message = encodeURIComponent(
      `Olá! Tenho interesse em adquirir a versão impressa do curso:\n\n📚 *${courseTitle}*\n⏱ ${courseDurationHours}h de duração\n\nPoderia me informar sobre valores e prazo de entrega?`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        disabled={generating}
        className="gap-1.5"
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Baixar PDF</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleBuyPrinted}
        className="gap-1.5"
      >
        <Printer className="h-4 w-4" />
        <span className="hidden sm:inline">Comprar Impresso</span>
      </Button>
    </div>
  );
}
