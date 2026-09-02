import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  Settings,
  BookOpen,
  Award,
  IdCard,
  Download,
  GraduationCap,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import logoText from '@/assets/logo_formak.png';

/** Itens de navegação principais (públicos). */
const publicNav = [
  { to: '/', label: 'Início', end: true },
  { to: '/cursos', label: 'Cursos', end: false },
];

/** Atalhos da conta, reutilizados no menu do desktop e no painel mobile. */
const accountLinks = [
  { to: '/meu-progresso', label: 'Meu Progresso', icon: TrendingUp },
  { to: '/meus-cursos', label: 'Meus Cursos', icon: BookOpen },
  { to: '/meus-certificados', label: 'Meus Certificados', icon: Award },
  { to: '/minha-carteirinha', label: 'Minha Carteirinha', icon: IdCard },
  { to: '/perfil', label: 'Editar Perfil', icon: Settings },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate('/');
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

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

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]"
    >
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center rounded-lg focus-ring" aria-label="Formak — página inicial">
            <img src={logoText} alt="Formak" className="h-6 w-auto object-contain sm:h-7" />
          </Link>

          {/* Navegação desktop com estado ativo evidente */}
          <nav className="hidden items-center gap-1 md:flex">
            {publicNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to="/meus-cursos"
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )
                }
              >
                Meus Cursos
              </NavLink>
            )}
          </nav>

          {/* Ações — desktop */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 rounded-full p-0 hover:bg-secondary"
                    aria-label="Abrir menu da conta"
                  >
                    <Avatar className="h-10 w-10 border border-border/70">
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-display text-xs font-semibold">
                        {getInitials(profile?.full_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60 rounded-xl p-1.5" align="end" forceMount>
                  <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile?.avatar_url || undefined} alt="" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {getInitials(profile?.full_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {profile?.full_name || user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrador' : 'Aluno'}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {accountLinks.map(({ to, label, icon: Icon }) => (
                    <DropdownMenuItem key={to} asChild>
                      <Link to={to} className="cursor-pointer rounded-lg">
                        <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer rounded-lg">
                        <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/install" className="cursor-pointer rounded-lg text-primary focus:text-primary">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar App
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Entrar</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth?mode=signup">Criar conta grátis</Link>
                </Button>
              </>
            )}
          </div>

          {/* Ações — mobile */}
          <div className="flex items-center gap-2 md:hidden">
            {!user && (
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu de navegação">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] max-w-sm p-0">
                <div className="flex h-full flex-col">
                  <div className="border-b border-border px-5 py-5">
                    {user ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11 border border-border/70">
                          <AvatarImage src={profile?.avatar_url || undefined} alt="" />
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {getInitials(profile?.full_name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-semibold">
                            {profile?.full_name || user.email}
                          </p>
                          <p className="text-xs text-muted-foreground">{isAdmin ? 'Administrador' : 'Aluno'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <GraduationCap className="h-5 w-5" />
                        </span>
                        <p className="font-display text-sm font-semibold">Bem-vindo à Formak</p>
                      </div>
                    )}
                  </div>

                  <nav className="flex-1 overflow-y-auto p-3">
                    <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Navegar
                    </p>
                    {publicNav.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                            isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}

                    {user && (
                      <>
                        <p className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Minha conta
                        </p>
                        {accountLinks.map(({ to, label, icon: Icon }) => (
                          <NavLink
                            key={to}
                            to={to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                                isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary',
                              )
                            }
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {label}
                          </NavLink>
                        ))}
                        {isAdmin && (
                          <NavLink
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                          >
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                            Painel Admin
                          </NavLink>
                        )}
                      </>
                    )}

                    <Link
                      to="/install"
                      onClick={() => setMobileMenuOpen(false)}
                      className="mt-4 flex min-h-11 items-center gap-3 rounded-xl bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      <Download className="h-4 w-4" />
                      Baixar o app
                    </Link>
                  </nav>

                  <div className="border-t border-border p-4">
                    {user ? (
                      <Button variant="outline" block onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        Sair da conta
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="hero" block asChild>
                          <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                            Criar conta grátis
                          </Link>
                        </Button>
                        <Button variant="outline" block asChild>
                          <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                            Já tenho conta
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
