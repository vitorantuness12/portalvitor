import { motion } from 'framer-motion';
import { Star, Award, Trophy, Flame, BookOpen, Target, Sparkles, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const badges = {
  firstCertificate: { icon: Award, label: 'Primeiro Certificado', color: 'text-amber-500' },
  perfectScore: { icon: Target, label: 'Nota Perfeita', color: 'text-emerald-500' },
  dedicated: { icon: Flame, label: 'Estudante Dedicado', color: 'text-orange-500' },
  bookworm: { icon: BookOpen, label: 'Rato de Biblioteca', color: 'text-blue-500' },
  champion: { icon: Trophy, label: 'Campeão', color: 'text-purple-500' },
};

const testimonials = [
  {
    id: 1,
    name: 'Ana Carolina Silva',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    course: 'Marketing Digital',
    score: 9.8,
    badges: ['perfectScore', 'firstCertificate'],
    testimonial: 'A plataforma transformou minha carreira! Consegui uma promoção logo após apresentar meu certificado.',
  },
  {
    id: 2,
    name: 'Carlos Eduardo Santos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    course: 'Gestão de Projetos',
    score: 9.2,
    badges: ['dedicated', 'champion'],
    testimonial: 'Estudar no meu próprio ritmo foi fundamental. Os exercícios práticos realmente fixam o conteúdo.',
  },
  {
    id: 3,
    name: 'Mariana Oliveira',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    course: 'Finanças Pessoais',
    score: 10.0,
    badges: ['perfectScore', 'bookworm', 'champion'],
    testimonial: 'Nota 10 na prova! O material é muito bem organizado e o suporte responde super rápido.',
  },
  {
    id: 4,
    name: 'Rafael Mendes',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    course: 'Liderança',
    score: 8.7,
    badges: ['firstCertificate', 'dedicated'],
    testimonial: 'Excelente custo-benefício. Certificado reconhecido e conteúdo atualizado.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Histórias de Sucesso
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-4">
            O que nossos{' '}
            <span className="hero-gradient-text">alunos</span> dizem
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Milhares de alunos já conquistaram certificados e transformaram suas carreiras.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              {/* Quote icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-12 w-12 text-primary" />
              </div>

              {/* Header with avatar and info */}
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {testimonial.course}
                  </p>
                  {/* Stars rating */}
                  <div className="flex items-center gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                </div>
                
                {/* Score badge */}
                <div className="flex flex-col items-center">
                  <div className={`text-2xl font-bold ${testimonial.score >= 9.5 ? 'text-emerald-500' : testimonial.score >= 8 ? 'text-primary' : 'text-amber-500'}`}>
                    {testimonial.score.toFixed(1)}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Nota</span>
                </div>
              </div>

              {/* Testimonial text */}
              <p className="text-muted-foreground mb-4 line-clamp-3">
                "{testimonial.testimonial}"
              </p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {testimonial.badges.map((badgeKey) => {
                  const badge = badges[badgeKey as keyof typeof badges];
                  if (!badge) return null;
                  const Icon = badge.icon;
                  return (
                    <Badge
                      key={badgeKey}
                      variant="secondary"
                      className="gap-1.5 py-1 px-2.5 bg-background"
                    >
                      <Icon className={`h-3.5 w-3.5 ${badge.color}`} />
                      <span className="text-xs">{badge.label}</span>
                    </Badge>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: '4.9', label: 'Nota média', icon: Star },
            { value: '97%', label: 'Taxa de aprovação', icon: Target },
            { value: '5k+', label: 'Certificados', icon: Award },
            { value: '98%', label: 'Recomendam', icon: Sparkles },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-4 rounded-xl bg-card border border-border"
            >
              <stat.icon className="h-5 w-5 text-primary mb-2" />
              <span className="text-2xl sm:text-3xl font-bold">{stat.value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground text-center">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
