import { motion } from 'framer-motion';
import { Star, Award, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const testimonials = [
  {
    id: 1,
    name: 'Ana Carolina Silva',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    course: 'Marketing Digital',
    score: 9.8,
    testimonial: 'A plataforma transformou minha carreira! Consegui uma promoção logo após apresentar meu certificado.',
  },
  {
    id: 2,
    name: 'Carlos Eduardo Santos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    course: 'Gestão de Projetos',
    score: 9.2,
    testimonial: 'Estudar no meu próprio ritmo foi fundamental. Os exercícios práticos realmente fixam o conteúdo.',
  },
  {
    id: 3,
    name: 'Mariana Oliveira',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    course: 'Finanças Pessoais',
    score: 10.0,
    testimonial: 'Nota 10 na prova! O material é muito bem organizado e o suporte responde super rápido.',
  },
  {
    id: 4,
    name: 'Rafael Mendes',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    course: 'Liderança',
    score: 8.7,
    testimonial: 'Excelente custo-benefício. Certificado reconhecido e conteúdo atualizado.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 lg:py-36 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4 gap-1.5 px-4 py-1 text-xs font-semibold">
            <Award className="h-3.5 w-3.5 text-primary" />
            Histórias de Sucesso
          </Badge>
          <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl mb-4">
            O que dizem{' '}
            <span className="hero-gradient-text">nossos alunos</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Milhares de alunos já conquistaram certificados e transformaram suas carreiras.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-card rounded-3xl border border-border/70 p-8 shadow-soft hover:shadow-elevated hover:border-primary/30 transition-all duration-300"
            >
              {/* Quote decoration */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="h-12 w-12 text-primary" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 border-2 border-primary/20 ring-4 ring-primary/5">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg">{testimonial.name}</h3>
                  <p className="text-sm text-muted-foreground">{testimonial.course}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                
                {/* Score */}
                <div className="text-center">
                  <div className={`font-display text-3xl font-black ${testimonial.score >= 9.5 ? 'text-emerald-500' : 'text-primary'}`}>
                    {testimonial.score.toFixed(1)}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">nota</span>
                </div>
              </div>

              {/* Testimonial */}
              <p className="text-base text-muted-foreground leading-relaxed italic">
                "{testimonial.testimonial}"
              </p>
              
              {/* Award badge */}
              {testimonial.score >= 9.5 && (
                <div className="absolute -bottom-3 -right-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: '4.9', label: 'Nota média', icon: Star },
            { value: '97%', label: 'Taxa de aprovação', icon: Award },
            { value: '5k+', label: 'Certificados', icon: Award },
            { value: '98%', label: 'Recomendam', icon: Star },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border/70 shadow-soft"
            >
              <stat.icon className="h-6 w-6 text-primary mb-3" />
              <span className="font-display text-3xl md:text-4xl font-extrabold hero-gradient-text">{stat.value}</span>
              <span className="text-sm text-muted-foreground mt-1">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
