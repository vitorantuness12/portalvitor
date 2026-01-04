import { motion } from 'framer-motion';
import { BookOpen, StickyNote, FileText, Trophy, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileStudyNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  progress: number;
  examUnlocked: boolean;
  currentModuleIndex: number;
  totalModules: number;
  onPrevModule: () => void;
  onNextModule: () => void;
}

const tabs = [
  { id: 'conteudo', label: 'Conteúdo', icon: BookOpen },
  { id: 'notas', label: 'Notas', icon: StickyNote },
  { id: 'exercicios', label: 'Exercícios', icon: FileText },
  { id: 'prova', label: 'Prova', icon: Trophy },
];

export function MobileStudyNav({
  activeTab,
  onTabChange,
  progress,
  examUnlocked,
  currentModuleIndex,
  totalModules,
  onPrevModule,
  onNextModule,
}: MobileStudyNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Module navigation (only on content tab) */}
      {activeTab === 'conteudo' && totalModules > 1 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-4 py-2 bg-muted/95 backdrop-blur-lg border-t border-border/50"
        >
          <button
            onClick={onPrevModule}
            disabled={currentModuleIndex === 0}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              currentModuleIndex === 0
                ? "text-muted-foreground/50"
                : "text-foreground bg-background/80 hover:bg-background active:scale-95"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>
          
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalModules }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === currentModuleIndex
                    ? "bg-primary"
                    : i < currentModuleIndex
                    ? "bg-primary/40"
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          
          <button
            onClick={onNextModule}
            disabled={currentModuleIndex === totalModules - 1}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              currentModuleIndex === totalModules - 1
                ? "text-muted-foreground/50"
                : "text-foreground bg-background/80 hover:bg-background active:scale-95"
            )}
          >
            Próximo
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-muted/80">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-primary to-primary/80"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Tab navigation */}
      <nav className="flex items-stretch bg-background/95 backdrop-blur-lg border-t border-border/50 safe-area-pb">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLocked = tab.id === 'prova' && !examUnlocked;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => !isLocked && onTabChange(tab.id)}
              disabled={isLocked}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 relative transition-colors",
                isActive 
                  ? "text-primary" 
                  : isLocked 
                  ? "text-muted-foreground/40"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                {isLocked && (
                  <Lock className="absolute -top-1 -right-1 h-3 w-3 text-muted-foreground/60" />
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
