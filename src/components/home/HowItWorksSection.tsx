import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserPlus, BookOpen, FileText, CheckCircle, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { icon: UserPlus, title: 'Crie sua conta', description: 'Cadastre-se gratuitamente de forma rápida e segura.' },
  { icon: BookOpen, title: 'Escolha seu curso', description: 'Encontre uma formação alinhada ao seu objetivo.' },
  { icon: FileText, title: 'Estude online', description: 'Avance no seu ritmo, de onde estiver.' },
  { icon: CheckCircle, title: 'Faça a avaliação', description: 'Complete a prova ou atividade final conforme as regras do curso.' },
  { icon: Award, title: 'Receba seu certificado', description: 'Após cumprir os requisitos, acesse seu certificado de conclusão.' },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/20 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-4">
            Comece sua jornada
            <br className="hidden sm:block" />{' '}
            <span className="hero-gradient-text">em poucos passos</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Escolha seu objetivo, encontre uma formação e estude com a flexibilidade que a sua rotina precisa.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-20 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative text-center"
                >
                  <div className="relative inline-block mb-6">
                    {/* Step number */}
                    <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-bold shadow-glow">
                      {index + 1}
                    </div>
                    
                    {/* Icon container */}
                    <div className="h-20 w-20 rounded-3xl bg-card border border-border/70 shadow-elevated flex items-center justify-center mx-auto">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link to="/cursos">
            <Button variant="hero" size="xl" className="gap-2 text-base px-10 shadow-glow group">
              Encontrar meu curso
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
