import { motion } from 'framer-motion';
import { Award, Star, Trophy, Flame, BookOpen, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const badges = [
  { name: 'Primeiro Passo', description: 'Inicie seu primeiro curso', icon: Target },
  { name: '1º Concluído', description: 'Complete um curso', icon: BookOpen },
  { name: '1º Certificado', description: 'Conquiste seu certificado', icon: Trophy },
  { name: 'Nota Perfeita', description: 'Tire 10 em uma prova', icon: Star },
  { name: 'Streak 7 Dias', description: 'Estude 7 dias seguidos', icon: Flame },
  { name: '50h de Estudo', description: 'Acumule 50 horas', icon: Clock },
  { name: '10 Cursos', description: 'Complete 10 cursos', icon: Award },
  { name: 'Velocista', description: 'Conclua em 24h', icon: Zap },
];

export const BadgesSection = () => {
  return (
    <section className="relative py-14 sm:py-20 lg:py-28 overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/15 blur-[140px] rounded-full -z-10" />
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
            Gamificação
          </span>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-6xl mb-4">
            Estude e{' '}
            <span className="hero-gradient-text">conquiste</span> badges
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            São mais de 25 conquistas para você colecionar enquanto avança nos estudos.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mb-12">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group h-full"
              >
                <div className="pressable bg-card rounded-2xl p-4 text-center border border-border/70 shadow-soft hover:border-primary/40 hover:-translate-y-1 hover:shadow-elevated transition-all duration-300 h-full">
                  <div className="mx-auto mb-3 h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-primary-soft flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glow group-hover:scale-105 transition-all">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="font-display font-bold text-xs sm:text-sm line-clamp-1 mb-1 tracking-tight">
                    {badge.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                    {badge.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/cursos">
            <Button variant="hero" size="lg" className="gap-2">
              <Award className="h-5 w-5" />
              Comece a Conquistar
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
