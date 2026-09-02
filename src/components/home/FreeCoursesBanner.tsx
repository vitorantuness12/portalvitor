import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Star, Sparkles, GraduationCap, Clock, Award, ArrowRight } from 'lucide-react';

export function FreeCoursesBanner() {
  const benefits = [
    { icon: GraduationCap, text: 'Acesso completo' },
    { icon: Clock, text: 'Estude no seu ritmo' },
    { icon: Award, text: 'Certificado gratuito' },
  ];

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto rounded-[2rem] overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-10 sm:p-14 lg:p-20"
        >
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-[120px]" />
          
          {/* Animated circles */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute top-8 right-8 w-32 h-32 border border-primary/10 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-8 left-8 w-24 h-24 border border-primary/15 rounded-full"
          />
          
          <div className="relative z-10 text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary px-5 py-2 rounded-full">
                <Star className="h-5 w-5" />
                <span className="font-bold text-sm uppercase tracking-wider">100% Gratuito</span>
                <Sparkles className="h-4 w-4" />
              </div>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4">
                Comece{' '}
                <span className="hero-gradient-text">grátis</span>
                <br />
                hoje mesmo
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Cursos gratuitos para você dar os primeiros passos na sua capacitação profissional.
              </p>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 sm:gap-6"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50"
                >
                  <benefit.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/cursos?price=free">
                <Button variant="hero" size="xl" className="text-lg px-10 shadow-glow-lg gap-2 group">
                  <Star className="h-5 w-5" />
                  Ver Cursos Gratuitos
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              +500 alunos já aproveitaram cursos gratuitos
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
