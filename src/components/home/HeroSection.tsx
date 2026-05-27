import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Users, BookOpen, Download, GraduationCap, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-20 lg:pb-32">
      {/* Premium ambient glow — bottom orange wash like reference */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 right-[-10%] w-[700px] h-[700px] bg-primary/25 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/15 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="hidden xs:inline">Cursos online • </span>Certificado reconhecido
            </div>

            <h1 className="font-display font-extrabold leading-[1.05] tracking-tight text-[2.5rem] xs:text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              Transforme seu <span className="hero-gradient-text">futuro</span> com cursos <span className="hero-gradient-text">online</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Seja iniciante ou profissional: aprenda no seu ritmo com mais de 200 cursos,
              certificado reconhecido e acesso vitalício. Comece hoje mesmo com a Formak.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto">
                  Começar Grátis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/cursos" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="gap-2 w-full sm:w-auto">
                  <Play className="h-5 w-5" />
                  Ver Catálogo
                </Button>
              </Link>
            </div>

            <Link
              to="/install"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              Baixar App Formak
              <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>

            {/* Stats — big numbers like reference */}
            <div className="grid grid-cols-3 gap-3 sm:gap-8 pt-6 sm:pt-8 border-t border-border/60">
              {[
                { value: '10k+', label: 'Alunos ativos' },
                { value: '200+', label: 'Cursos' },
                { value: '100%', label: 'Online' },
              ].map(({ value, label }) => (
                <div key={label} className="min-w-0">
                  <p className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight hero-gradient-text">
                    {value}
                  </p>
                  <p className="mt-1 text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Image — tilted phone-style mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden md:block"
          >
            <div className="relative aspect-[4/5] max-w-md lg:max-w-lg mx-auto" style={{ perspective: '1200px' }}>
              <div className="absolute -inset-10 bg-primary/25 blur-[100px] rounded-full -z-10" />
              <motion.div
                animate={{ rotateY: [-8, -6, -8], rotateX: [6, 8, 6] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full h-full rounded-[2.5rem] overflow-hidden border border-border/60 shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.5)]"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=1000&fit=crop"
                  alt="Estudantes aprendendo online com a Formak"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              </motion.div>

              {/* Floating notification-style cards */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                transition={{ y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.6, delay: 0.6 }, x: { duration: 0.6, delay: 0.6 } }}
                className="absolute -left-6 sm:-left-10 top-12 glass p-4 rounded-2xl shadow-2xl border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm leading-tight">Novo Certificado</p>
                    <p className="text-xs text-primary font-semibold">Liberado agora</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0, y: [0, 8, 0] }}
                transition={{ y: { duration: 4, repeat: Infinity, delay: 1.5, ease: 'easeInOut' }, opacity: { duration: 0.6, delay: 0.9 }, x: { duration: 0.6, delay: 0.9 } }}
                className="absolute -right-6 sm:-right-10 bottom-16 glass p-4 rounded-2xl shadow-2xl border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm leading-tight">Progresso +32%</p>
                    <p className="text-xs text-muted-foreground">Este mês</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="absolute left-1/2 -translate-x-1/2 -bottom-6 glass px-5 py-3 rounded-2xl shadow-2xl border border-primary/20 flex items-center gap-3 whitespace-nowrap"
              >
                <GraduationCap className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">+10.000 alunos aprendendo</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
