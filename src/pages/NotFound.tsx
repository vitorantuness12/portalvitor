import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, BookOpen, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="page-shell flex min-h-screen flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
          <Compass className="h-11 w-11 text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="font-display text-7xl font-bold tracking-tight text-primary sm:text-8xl">
          404
        </h1>
        <h2 className="mt-3 font-display text-xl font-bold text-foreground sm:text-2xl">
          Essa página saiu do plano de aula
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          Não encontramos <span className="font-mono text-foreground">{location.pathname}</span>. Ela pode ter sido movida ou não existe mais.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="hero" size="lg">
            <Link to="/">
              <Home className="h-4 w-4" />
              Voltar para o início
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/cursos">
              <BookOpen className="h-4 w-4" />
              Ver cursos
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
