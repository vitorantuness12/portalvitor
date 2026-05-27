import { motion } from 'framer-motion';
import { GraduationCap, Clock, Award, Shield, Zap, HeartHandshake } from 'lucide-react';

const features = [
  { icon: <GraduationCap className="h-6 w-6" />, title: 'Conteúdo de Qualidade', description: 'Cursos desenvolvidos por especialistas com anos de experiência no mercado.' },
  { icon: <Clock className="h-6 w-6" />, title: 'Aprenda no Seu Ritmo', description: 'Acesse o conteúdo quando e onde quiser, sem limitações de horário.' },
  { icon: <Award className="h-6 w-6" />, title: 'Certificado Automático', description: 'Receba seu certificado imediatamente após aprovação na prova final.' },
  { icon: <Shield className="h-6 w-6" />, title: 'Acesso Vitalício', description: 'Uma vez comprado, o curso é seu para sempre. Sem mensalidades.' },
  { icon: <Zap className="h-6 w-6" />, title: 'Exercícios Práticos', description: 'Fixe o conhecimento com exercícios interativos durante o curso.' },
  { icon: <HeartHandshake className="h-6 w-6" />, title: 'Suporte Dedicado', description: 'Nossa equipe está pronta para ajudar você em qualquer dúvida.' },
];

export function WhyChooseUs() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/30 to-background" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Por que Formak
          </span>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-6xl mb-4">
            Sua carreira merece a{' '}
            <span className="hero-gradient-text">Formak</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Tudo o que você precisa para aprender, evoluir e conquistar seu certificado num só lugar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group relative p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.4)] transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.4)] mb-5">
                {feature.icon}
              </div>
              <h3 className="font-display font-bold text-lg leading-tight tracking-tight mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}