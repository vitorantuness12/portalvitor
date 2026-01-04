import { motion } from 'framer-motion';
import { UserPlus, BookOpen, FileText, Trophy, Award, ArrowRight, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Matrícula',
    description: 'Crie sua conta e escolha o curso ideal para você.',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  {
    icon: BookOpen,
    title: 'Estudo',
    description: 'Acesse o conteúdo completo no seu ritmo, 24/7.',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  {
    icon: FileText,
    title: 'Exercícios',
    description: 'Pratique com exercícios para fixar o conhecimento.',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  {
    icon: Trophy,
    title: 'Prova Final',
    description: 'Faça a prova e alcance a nota mínima 7,0.',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
  },
  {
    icon: Award,
    title: 'Certificado',
    description: 'Receba seu certificado automaticamente!',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4">
            Como{' '}
            <span className="hero-gradient-text">funciona</span>?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Em apenas 5 passos simples, você conquista seu certificado.
          </p>
        </motion.div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-amber-500 via-rose-500 to-emerald-500 transform -translate-y-1/2 rounded-full opacity-20" />
          
          <div className="grid grid-cols-5 gap-4 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon circle */}
                  <div className={`relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-4`}>
                    <Icon className="h-10 w-10 text-white" />
                    {/* Step number */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-card border-2 border-border flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                  </div>

                  {/* Arrow connector (except last) */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)]">
                      <ArrowRight className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                    </div>
                  )}

                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile/Tablet Vertical Timeline */}
        <div className="lg:hidden relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 via-amber-500 via-rose-500 to-emerald-500 opacity-30" />

          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4 pl-2"
                >
                  {/* Icon */}
                  <div className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 p-4 rounded-xl ${step.bgColor} border ${step.borderColor}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Passo {index + 1}</span>
                      {index === steps.length - 1 && (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <h3 className="font-semibold text-base mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
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
          transition={{ delay: 0.5 }}
          className="text-center mt-10 sm:mt-14"
        >
          <p className="text-muted-foreground mb-4">
            Pronto para começar sua jornada de aprendizado?
          </p>
          <a
            href="/cursos"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Ver Cursos Disponíveis
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
