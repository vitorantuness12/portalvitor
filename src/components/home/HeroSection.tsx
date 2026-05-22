import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Award, Users, BookOpen, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
      {/* Premium ambient glow */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Certificado reconhecido
            </div>

            <h1 className="font-display font-extrabold leading-[1.05] tracking-tight text-4xl sm:text-5xl lg:text-7xl">
              Aprenda algo{' '}
              <span className="hero-gradient-text">novo</span>
              <br className="hidden sm:block" />
              {' '}com cursos online
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              Estude no seu ritmo com cursos de diversas áreas do conhecimento.
              Obtenha certificados e amplie suas habilidades com a Formak.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/cursos" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="gap-2 w-full sm:w-auto">
                  Explorar Cursos
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="gap-2 w-full sm:w-auto">
                  <Play className="h-5 w-5" />
                  Começar Grátis
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-border/60">
              {[
                { icon: Users, value: '10k+', label: 'Alunos ativos' },
                { icon: BookOpen, value: '200+', label: 'Cursos disponíveis' },
                { icon: Award, value: '5k+', label: 'Certificados emitidos' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative aspect-[4/5] max-w-lg mx-auto">
              <div className="absolute -inset-6 bg-primary/15 blur-[80px] rounded-full -z-10" />
              <div className="relative w-full h-full rounded-[2rem] overflow-hidden border border-border/60 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=1000&fit=crop"
                  alt="Estudantes aprendendo online com a Formak"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
              </div>
              
              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-4 sm:-left-6 top-10 sm:top-12 glass p-3 sm:p-4 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm sm:text-base leading-tight">Certificado</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Gerado na hora</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1.5, ease: 'easeInOut' }}
                className="absolute -right-4 sm:-right-6 bottom-10 sm:bottom-14 glass p-3 sm:p-4 rounded-2xl shadow-2xl"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-primary/15 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm sm:text-base leading-tight">100% Online</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Estude onde quiser</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
