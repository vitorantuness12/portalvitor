import { motion } from 'framer-motion';
import { Award, Star, Trophy, Flame, BookOpen, Clock, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const badges = [
  { emoji: '🎯', name: 'Primeiro Passo', description: 'Inicie seu primeiro curso', icon: Target, color: 'text-blue-500' },
  { emoji: '✅', name: '1º Curso Concluído', description: 'Complete um curso', icon: BookOpen, color: 'text-emerald-500' },
  { emoji: '🏆', name: '1º Certificado', description: 'Conquiste seu certificado', icon: Trophy, color: 'text-amber-500' },
  { emoji: '⭐', name: 'Nota Perfeita', description: 'Tire 10 em uma prova', icon: Star, color: 'text-yellow-500' },
  { emoji: '🔥', name: 'Streak 7 Dias', description: 'Estude 7 dias seguidos', icon: Flame, color: 'text-orange-500' },
  { emoji: '⏰', name: '50h de Estudo', description: 'Acumule 50 horas', icon: Clock, color: 'text-purple-500' },
  { emoji: '👑', name: '10 Cursos', description: 'Complete 10 cursos', icon: Award, color: 'text-pink-500' },
  { emoji: '⚡', name: 'Velocista', description: 'Conclua em 24h', icon: Zap, color: 'text-cyan-500' },
];

export const BadgesSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Trophy className="h-4 w-4" />
            Gamificação
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Conquiste Badges e Evolua
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Desbloqueie conquistas especiais enquanto avança nos seus estudos. 
            São mais de 25 badges para você colecionar!
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="bg-background rounded-xl p-4 text-center border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full">
                <div className="text-3xl sm:text-4xl mb-2 group-hover:scale-110 transition-transform">
                  {badge.emoji}
                </div>
                <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 mb-1">
                  {badge.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                  {badge.description}
                </p>
              </div>
            </motion.div>
          ))}
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
