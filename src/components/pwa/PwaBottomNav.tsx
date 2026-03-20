import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Search, GraduationCap, Award, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/meu-progresso', label: 'Início', icon: BookOpen },
  { path: '/cursos', label: 'Explorar', icon: Search },
  { path: '/meus-cursos', label: 'Cursos', icon: GraduationCap },
  { path: '/meus-certificados', label: 'Diplomas', icon: Award },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export function PwaBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = tabs.find(t => location.pathname.startsWith(t.path))?.path 
    || (location.pathname === '/' ? '/meu-progresso' : null);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/40 safe-area-pb">
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.path;
          const Icon = tab.icon;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="pwaActiveTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-primary rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
