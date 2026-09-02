import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, ChevronDown, Bell, Users, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import heroStudents from '@/assets/hero-students.png';

// Modern animated background with gradient orbs and grid
function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Gradient orbs (visiveis em mobile e desktop) */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] rounded-full bg-gradient-to-br from-primary/30 to-orange-400/20 blur-[80px] animate-blob1" />
      <div className="absolute top-1/4 -right-40 w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-bl from-orange-400/25 to-primary/20 blur-[100px] animate-blob2" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full bg-gradient-to-tr from-primary/20 to-orange-300/15 blur-[120px] animate-blob3" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />
    </div>
  );
}

// Card flutuante generico
function FloatingChip({
  children,
  className = '',
  delay = 0,
  duration = 3,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay: duration * 0.3 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-8 pb-16 overflow-hidden">
      <HeroBackground />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Badge
                variant="secondary"
                className="gap-2 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Cursos online · Certificado reconhecido
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-1"
            >
              <h1 className="font-display font-extrabold leading-none tracking-tight text-foreground">
                <span className="block text-5xl sm:text-6xl lg:text-7xl text-[#1F2A44] dark:text-white leading-none">Transforme</span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl text-[#1F2A44] dark:text-white leading-none">
                  seu <span className="text-[#FF7A1A]">futuro</span>
                </span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl text-[#1F2A44] dark:text-white leading-none">com cursos</span>
                <span className="block text-5xl sm:text-6xl lg:text-7xl text-[#FF7A1A] leading-none">online</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Seja iniciante ou profissional: aprenda no seu ritmo com mais de 200 cursos,
                certificado reconhecido e acesso vitalício. Comece hoje mesmo com a Formak.
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="gap-2 w-full text-base group">
                  Começar Grátis
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/cursos" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="xl"
                  className="gap-2 w-full text-base bg-transparent hover:bg-secondary/50"
                >
                  <Play className="h-4 w-4" />
                  Ver Catálogo
                </Button>
              </Link>
            </motion.div>

            {/* App download hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Download className="h-4 w-4" />
              <span>Baixar App Formak</span>
            </motion.div>
          </motion.div>

          {/* Right Content - Imagem destaque + chips flutuantes */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[380px] sm:h-[460px] lg:h-[540px] flex items-center justify-center mx-auto w-full max-w-[420px] lg:max-w-none"
          >
            {/* Imagem principal com moldura - perfeitamente centralizada */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-0 w-[260px] sm:w-[320px] lg:w-[380px] aspect-square rounded-3xl overflow-hidden border border-border/60 shadow-elevated bg-card"
            >
              <img
                src={heroStudents}
                alt="Alunos Formak estudando"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Chip superior esquerdo: Novo Certificado */}
            <FloatingChip
              delay={0.5}
              duration={3.5}
              className="absolute top-6 sm:top-8 left-0 sm:-left-2 z-10"
            >
              <div className="flex items-center gap-3 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-elevated">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="font-semibold text-xs sm:text-sm">Novo Certificado</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">1 min atrás</p>
                </div>
              </div>
            </FloatingChip>

            {/* Chip inferior direito: Progresso */}
            <FloatingChip
              delay={0.7}
              duration={3.2}
              className="absolute bottom-16 sm:bottom-20 right-0 sm:-right-2 z-10"
            >
              <div className="flex items-center gap-3 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-elevated">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-400 flex items-center justify-center">
                  <span className="text-white text-sm">🚀</span>
                </div>
                <div className="leading-tight">
                  <p className="font-semibold text-xs sm:text-sm">Progresso +32%</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Esta semana</p>
                </div>
              </div>
            </FloatingChip>

            {/* Chip inferior esquerdo: Alunos */}
            <FloatingChip
              delay={0.9}
              duration={3.8}
              className="absolute bottom-2 left-2 sm:left-4 z-10"
            >
              <div className="flex items-center gap-3 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-elevated">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs sm:text-sm font-semibold whitespace-nowrap">
                  +10.000 alunos aprendendo
                </p>
              </div>
            </FloatingChip>

            {/* Decoracaoes circulares */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1 left-1 sm:top-2 sm:left-2 w-16 sm:w-20 h-16 sm:h-20 border-2 border-primary/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute top-1 right-1 sm:top-4 sm:right-4 w-12 sm:w-16 h-12 sm:h-16 border-2 border-primary/10 rounded-full"
            />

            {/* Pequenos pontos decorativos */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1/3 left-0 w-3 h-3 rounded-full bg-primary/40"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute top-2/3 right-2 w-2 h-2 rounded-full bg-orange-400/50"
            />
          </motion.div>
        </div>

        {/* Faixa de credibilidade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 lg:mt-16 pt-8 border-t border-border/40"
        >
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '10k+', label: 'Alunos ativos' },
              { value: '200+', label: 'Cursos' },
              { value: '100%', label: 'Online' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl sm:text-4xl lg:text-5xl font-black hero-gradient-text">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>


      </div>
    </section>
  );
}
