import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Download, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Animated gradient mesh background
function GradientMesh() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-[120px] animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute top-[30%] right-[-15%] w-[50%] h-[70%] rounded-full bg-gradient-to-bl from-primary/20 to-transparent blur-[140px] animate-[float_10s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-[-10%] left-[20%] w-[70%] h-[50%] rounded-full bg-gradient-to-tr from-primary/25 to-transparent blur-[130px] animate-[float_12s_ease-in-out_infinite]" />
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
}

// Floating course preview card
function CoursePreviewCard({ title, category, progress }: { title: string; category: string; progress: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl p-4 shadow-elevated"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{title}</p>
          <p className="text-xs text-muted-foreground">{category}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-8 pb-16 overflow-hidden">
      <GradientMesh />
      
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
              <Badge variant="secondary" className="gap-2 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                +200 cursos disponíveis
              </Badge>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="font-display font-black leading-[0.95] tracking-tight">
                <span className="block text-5xl sm:text-6xl lg:text-7xl">
                  Aprenda sem
                </span>
                <span className="block text-6xl sm:text-7xl lg:text-8xl hero-gradient-text">
                  limites
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Cursos online com certificado reconhecido. Estude no seu ritmo, 
                conquiste sua carreira e abra portas para o futuro.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                <Button variant="hero" size="xl" className="gap-2 w-full text-base group">
                  Começar Gratuitamente
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/cursos" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="gap-2 w-full text-base bg-transparent hover:bg-secondary/50">
                  <Play className="h-4 w-4" />
                  Ver Cursos
                </Button>
              </Link>
            </motion.div>

            {/* Mini stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6 pt-4"
            >
              {[
                { value: '10k+', label: 'Alunos' },
                { value: '200+', label: 'Cursos' },
                { value: '100%', label: 'Online' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="font-display text-2xl sm:text-3xl font-extrabold hero-gradient-text">{stat.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Content - Floating Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] hidden lg:block"
          >
            {/* Main card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-card/95 backdrop-blur-xl border border-border/60 rounded-3xl p-6 shadow-elevated"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-glow">
                  <span className="text-2xl font-black text-white">F</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Formak Academy</h3>
                  <p className="text-sm text-muted-foreground">Educação de qualidade</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <span className="text-sm font-medium">Cursos concluídos</span>
                  <span className="font-bold text-primary">12</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <span className="text-sm font-medium">Horas de estudo</span>
                  <span className="font-bold text-primary">48h</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                  <span className="text-sm font-medium">Certificados</span>
                  <span className="font-bold text-primary">8</span>
                </div>
              </div>
            </motion.div>

            {/* Floating preview cards */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-8 right-0 w-[240px]"
            >
              <CoursePreviewCard title="Marketing Digital" category="Negócios" progress={75} />
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-12 left-0 w-[220px]"
            >
              <CoursePreviewCard title="Python Básico" category="Programação" progress={45} />
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute top-4 left-4 w-20 h-20 border-2 border-primary/20 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-4 right-4 w-16 h-16 border-2 border-primary/10 rounded-full"
            />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
