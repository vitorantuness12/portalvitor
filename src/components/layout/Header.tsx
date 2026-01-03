import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Menu, X, User, LogOut, LayoutDashboard, Settings } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 glass border-b border-border/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="hero-gradient rounded-lg p-2">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">EduPlataforma</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Início
            </Link>
            <Link to="/cursos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Cursos
            </Link>
            {user && (
              <Link to="/meus-cursos" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Meus Cursos
              </Link>
            )}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin ? 'Administrador' : 'Aluno'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/meus-cursos" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Meus Cursos
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="hero">Cadastrar</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-border/50"
          >
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Início
              </Link>
              <Link
                to="/cursos"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cursos
              </Link>
              {user ? (
                <>
                  <Link
                    to="/meus-cursos"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Meus Cursos
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Painel Admin
                    </Link>
                  )}
                  <Button onClick={handleSignOut} variant="destructive" className="w-full">
                    Sair
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Entrar</Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full">Cadastrar</Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
