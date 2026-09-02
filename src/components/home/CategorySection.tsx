import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Laptop, Briefcase, Megaphone, Palette, User, Heart, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const iconMap: Record<string, React.ReactNode> = {
  laptop: <Laptop className="h-7 w-7" />,
  briefcase: <Briefcase className="h-7 w-7" />,
  megaphone: <Megaphone className="h-7 w-7" />,
  palette: <Palette className="h-7 w-7" />,
  user: <User className="h-7 w-7" />,
  heart: <Heart className="h-7 w-7" />,
};

export function CategorySection() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  if (!categories || categories.length === 0) return null;

  return (
    <section className="relative py-20 sm:py-28 lg:py-36">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary/30 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-xs font-semibold">
            Área de Atuação
          </Badge>
          <h2 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-4">
            Encontre sua{' '}
            <span className="hero-gradient-text">área</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Explore categorias pensadas para cada objetivo profissional e pessoal.
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              <Link
                to={`/cursos?categoria=${category.name.toLowerCase().replace(' ', '-')}`}
                className="group relative flex flex-col items-center text-center p-6 sm:p-8 bg-card rounded-2xl border border-border/70 shadow-soft hover:shadow-elevated hover:border-primary/40 hover:-translate-y-2 transition-all duration-300 h-full"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition-all duration-300 mb-4">
                    {iconMap[category.icon || 'laptop'] || <Laptop className="h-7 w-7" />}
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver cursos
                  </p>
                </div>
                
                {/* Arrow indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
