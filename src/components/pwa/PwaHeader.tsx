import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import logo from '@/assets/icone_formak.png';

// Pages where a back button should show instead of logo
const detailPages = ['/curso/', '/suporte/', '/minha-carteirinha', '/validar-'];

// Page title mapping
const pageTitles: Record<string, string> = {
  '/meu-progresso': 'Início',
  '/cursos': 'Explorar',
  '/meus-cursos': 'Meus Cursos',
  '/meus-certificados': 'Certificados',
  '/perfil': 'Perfil',
  '/minha-carteirinha': 'Carteirinha',
  '/onboarding': 'Boas-vindas',
};

export function PwaHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDetailPage = detailPages.some(p => location.pathname.startsWith(p));
  const pageTitle = pageTitles[location.pathname] || '';

  const { data: profile } = useQuery({
    queryKey: ['header-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const getInitials = (name?: string | null) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return 'U';
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30 pt-[env(safe-area-inset-top,0px)]">
      <div className="flex h-12 items-center justify-between px-4">
        {/* Left side */}
        {isDetailPage ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-1"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Link to="/meu-progresso" className="flex items-center gap-2">
            <img src={logo} alt="Formak" className="h-7 w-7 rounded-lg" />
            {pageTitle && (
              <span className="text-base font-semibold">{pageTitle}</span>
            )}
          </Link>
        )}

        {/* Center - detail page title */}
        {isDetailPage && (
          <span className="text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2 max-w-[60%] truncate">
            {pageTitle}
          </span>
        )}

        {/* Right side */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user && (
            <Link to="/perfil">
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
