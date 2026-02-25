import { BookOpen, Award, GraduationCap, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/meus-cursos', icon: BookOpen, label: 'Cursos' },
  { to: '/meu-progresso', icon: Award, label: 'Progresso' },
  { to: '/meus-certificados', icon: GraduationCap, label: 'Certificados' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export function PwaBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
