import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, GraduationCap, Clock, Award } from 'lucide-react';

export function FreeCoursesBanner() {
  const benefits = [
    { icon: GraduationCap, text: 'Acesso completo ao conteúdo' },
    { icon: Clock, text: 'Estude no seu ritmo' },
    { icon: Award, text: 'Certificado incluso' },
  ];

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden border border-primary/30 bg-gradient-to-br from-primary/20 via-primary/5 to-background p-8 sm:p-12 lg:p-16">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/30 rounded-full blur-[120px]" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px]" />
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 text-primary px-4 py-2 rounded-full mb-6"
              >
                <Gift className="h-5 w-5" />
                <span className="font-bold uppercase tracking-wider text-xs">100% Gratuito</span>
                <Sparkles className="h-4 w-4" />
              </motion.div>

              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
                Comece sua jornada{' '}
                <span className="hero-gradient-text">sem gastar nada</span>
              </h2>

              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Cursos 100% gratuitos para você dar os primeiros passos na sua capacitação.
                Sem cartão de crédito, sem compromisso.
              </p>

              <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.text}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-2 text-foreground"
                  >
                    <div className="p-2 rounded-full bg-primary/15 border border-primary/30">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>

              <Link to="/cursos?price=free">
                <Button variant="hero" size="xl" className="text-lg px-8 shadow-[0_0_32px_hsl(var(--primary)/0.5)]">
                  <Gift className="mr-2 h-5 w-5" />
                  Ver Cursos Gratuitos
                </Button>
              </Link>

              <p className="mt-6 text-sm text-muted-foreground">
                Já são mais de <span className="font-bold text-foreground">500 alunos</span> aproveitando nossos cursos gratuitos
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}