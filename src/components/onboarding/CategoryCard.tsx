import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string | null;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export function CategoryCard({ id, name, icon, isSelected, onToggle }: CategoryCardProps) {
  // Get the icon component dynamically
  const IconComponent = icon && (LucideIcons as any)[icon] 
    ? (LucideIcons as any)[icon] 
    : LucideIcons.BookOpen;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onToggle(id)}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-xl border-2 transition-all duration-200 w-full aspect-square",
        isSelected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
      )}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
        </motion.div>
      )}
      
      <div className={cn(
        "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      
      <span className={cn(
        "text-xs sm:text-sm font-medium text-center line-clamp-2 leading-tight",
        isSelected ? "text-foreground" : "text-muted-foreground"
      )}>
        {name}
      </span>
    </motion.button>
  );
}
