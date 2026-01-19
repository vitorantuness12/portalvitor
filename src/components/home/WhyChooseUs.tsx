import { motion } from 'framer-motion';
import { GraduationCap, Clock, Award, Shield, Zap, HeartHandshake } from 'lucide-react';

const features = [
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: 'Conteúdo de Qualidade',
    description: 'Cursos desenvolvidos por especialistas com anos de experiência no mercado.',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Aprenda no Seu Ritmo',
    description: 'Acesse o conteúdo quando e onde quiser, sem limitações de horário.',
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: 'Certificado Automático',
    description: 'Receba seu certificado imediatamente após aprovação na prova final.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Acesso Vitalício',
    description: 'Uma vez comprado, o curso é seu para sempre. Sem mensalidades.',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Exercícios Práticos',
    description: 'Fixe o conhecimento com exercícios interativos durante o curso.',
  },
  {
    icon: <HeartHandshake className="h-6 w-6" />,
    title: 'Suporte Dedicado',
    description: 'Nossa equipe está pronta para ajudar você em qualquer dúvida.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4">
            Por que escolher a{' '}
            <span className="hero-gradient-text">Formak</span>?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Oferecemos a melhor experiência de aprendizado online com qualidade comprovada.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-xl border border-border bg-background hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {feature.icon}
              </div>
              <h3 className="font-display font-semibold text-lg leading-tight tracking-tight mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
