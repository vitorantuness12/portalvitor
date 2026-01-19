import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BookOpen, BarChart3, Award, MessageCircle, ChevronLeft, ChevronRight, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const tourSlides = [
  {
    icon: BookOpen,
    title: "Meus Cursos",
    description: "Acesse todos os cursos em que você está inscrito. Acompanhe seu progresso e continue de onde parou.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Meu Progresso",
    description: "Visualize estatísticas detalhadas do seu aprendizado. Tempo de estudo, cursos concluídos e muito mais.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Award,
    title: "Certificados",
    description: "Ao concluir um curso com aprovação, você recebe um certificado válido em todo território nacional.",
    color: "text-accent-foreground",
    bgColor: "bg-accent",
  },
  {
    icon: MessageCircle,
    title: "Suporte",
    description: "Precisa de ajuda? Use nosso chat inteligente ou abra um ticket para falar com nossa equipe.",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
];

interface OnboardingStep3Props {
  onComplete: () => void;
  isCompleting: boolean;
}

export function OnboardingStep3({ onComplete, isCompleting }: OnboardingStep3Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = tourSlides[currentSlide];
  const isLastSlide = currentSlide === tourSlides.length - 1;

  const nextSlide = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

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
        className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
      >
        <Rocket className="h-8 w-8 text-primary" />
      </motion.div>

      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
        Conheça a Plataforma 🚀
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Veja as principais funcionalidades que preparamos para turbinar seu aprendizado.
      </p>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-card border rounded-2xl p-8 shadow-lg"
          >
            <div className={cn("h-20 w-20 rounded-full mx-auto mb-6 flex items-center justify-center", slide.bgColor)}>
              <slide.icon className={cn("h-10 w-10", slide.color)} />
            </div>
            
            <h2 className="text-xl font-bold mb-3">{slide.title}</h2>
            <p className="text-muted-foreground">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Slide indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {tourSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentSlide === index
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <Button
            variant="hero"
            size="lg"
            onClick={nextSlide}
            disabled={isCompleting}
            className="flex-1"
          >
            {isCompleting ? (
              "Finalizando..."
            ) : isLastSlide ? (
              <>
                Começar a Estudar
                <Rocket className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
