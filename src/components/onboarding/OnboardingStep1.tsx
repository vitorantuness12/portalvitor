import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CategoryCard } from './CategoryCard';
import { Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface OnboardingStep1Props {
  userName: string;
  categories: Category[];
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

export function OnboardingStep1({
  userName,
  categories,
  selectedCategories,
  onToggleCategory,
  onNext,
  isLoading,
}: OnboardingStep1Props) {
  const canProceed = selectedCategories.length >= 1 && selectedCategories.length <= 3;

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
        <Sparkles className="h-8 w-8 text-primary" />
      </motion.div>

      <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
        Olá, {userName}! 👋
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        Que bom ter você aqui! Selecione de <strong>1 a 3 áreas</strong> que mais te interessam para personalizarmos sua experiência.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <CategoryCard
                id={category.id}
                name={category.name}
                icon={category.icon}
                isSelected={selectedCategories.includes(category.id)}
                onToggle={onToggleCategory}
              />
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-2 w-full max-w-sm">
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={onNext}
          disabled={!canProceed}
        >
          Continuar
        </Button>
        <p className="text-xs text-muted-foreground">
          {selectedCategories.length}/3 categorias selecionadas
        </p>
      </div>
    </motion.div>
  );
}
