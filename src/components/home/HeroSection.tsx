import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Award, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Award className="h-4 w-4" />
              Cursos com certificado reconhecido
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
              Transforme sua{' '}
              <span className="hero-gradient-text">carreira</span>
              {' '}com cursos online
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg">
              Aprenda no seu ritmo com cursos desenvolvidos por especialistas.
              Obtenha certificados e impulsione sua carreira profissional.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/cursos">
                <Button variant="hero" size="xl" className="gap-2">
                  Explorar Cursos
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="outline" size="xl" className="gap-2">
                  <Play className="h-5 w-5" />
                  Começar Grátis
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Users className="h-6 w-6 text-primary" />
                  10k+
                </div>
                <p className="text-sm text-muted-foreground">Alunos ativos</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <BookOpen className="h-6 w-6 text-primary" />
                  50+
                </div>
                <p className="text-sm text-muted-foreground">Cursos disponíveis</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Award className="h-6 w-6 text-primary" />
                  5k+
                </div>
                <p className="text-sm text-muted-foreground">Certificados emitidos</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 hero-gradient rounded-3xl rotate-3 opacity-20" />
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=800&fit=crop"
                alt="Estudantes aprendendo online"
                className="relative rounded-3xl object-cover w-full h-full shadow-2xl"
              />
              
              {/* Floating cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -left-8 top-1/4 bg-card p-4 rounded-xl shadow-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold">Certificado</p>
                    <p className="text-sm text-muted-foreground">Gerado na hora</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute -right-8 bottom-1/4 bg-card p-4 rounded-xl shadow-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Cursos IA</p>
                    <p className="text-sm text-muted-foreground">Conteúdo atualizado</p>
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
