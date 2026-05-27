import { motion } from 'framer-motion';
import { UserPlus, BookOpen, FileText, Trophy, Award, ArrowRight } from 'lucide-react';

const steps = [
  { icon: UserPlus, title: 'Matrícula', description: 'Crie sua conta e escolha o curso ideal para você.' },
  { icon: BookOpen, title: 'Estudo', description: 'Acesse o conteúdo completo no seu ritmo, 24/7.' },
  { icon: FileText, title: 'Exercícios', description: 'Pratique com exercícios para fixar o conhecimento.' },
  { icon: Trophy, title: 'Prova Final', description: 'Faça a prova e alcance a nota mínima 7,0.' },
  { icon: Award, title: 'Certificado', description: 'Receba seu certificado automaticamente!' },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Como funciona
          </span>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-6xl mb-4">
            Do zero ao{' '}
            <span className="hero-gradient-text">certificado</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Em apenas 5 passos simples, você sai do zero e conquista seu certificado reconhecido.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group relative p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute -top-3 left-6 font-display text-5xl font-extrabold text-primary/20 group-hover:text-primary/40 transition-colors">
                  0{index + 1}
                </div>
                <div className="relative pt-6">
                  <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_24px_hsl(var(--primary)/0.4)] mb-4">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg tracking-tight mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="/cursos"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-[0_0_24px_hsl(var(--primary)/0.4)]"
          >
            Ver Cursos Disponíveis
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
