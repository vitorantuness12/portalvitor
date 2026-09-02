import { motion } from 'framer-motion';
import { Award, Star, Trophy, Flame, BookOpen, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const badges = [
  { name: 'Primeiro Passo', description: 'Inicie seu primeiro curso', icon: Target },
  { name: '1º Concluído', description: 'Complete um curso', icon: BookOpen },
  { name: '1º Certificado', description: 'Conquiste seu certificado', icon: Trophy },
  { name: 'Nota Perfeita', description: 'Tire 10 na prova', icon: Star },
  { name: 'Streak 7 Dias', description: 'Estude 7 dias seguidos', icon: Flame },
  { name: '50h de Estudo', description: 'Acumule 50 horas', icon: Clock },
  { name: '10 Cursos', description: 'Complete 10 cursos', icon: Award },
  { name: 'Velocista', description: 'Conclua em 24h', icon: Zap },
];

export const BadgesSection = () => {
  return (
    <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-t from-primary/10 to-transparent blur-[140px] -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-xs font-semibold">
            Gamificação
          </Badge>
          <h2 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-4">
            Colecione{' '}
            <span className="hero-gradient-text">conquistas</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Mais de 25 badges para você conquistar enquanto avança nos estudos.
          </p>
        </motion.div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="group relative bg-card rounded-2xl p-5 text-center border border-border/70 shadow-soft hover:shadow-elevated hover:border-primary/40 hover:-translate-y-2 transition-all duration-300 h-full">
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary group-hover:to-primary/80 group-hover:shadow-glow transition-all duration-300">
                      <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                    <h3 className="font-display font-bold text-xs sm:text-sm mb-1 leading-tight">
                      {badge.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/cursos">
            <Button variant="hero" size="lg" className="gap-2 text-base px-8 shadow-glow group">
              <Award className="h-5 w-5" />
              Começar a Colecionar
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
