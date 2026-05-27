import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Laptop, Briefcase, Megaphone, Palette, User, Heart, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, React.ReactNode> = {
  laptop: <Laptop className="h-8 w-8" />,
  briefcase: <Briefcase className="h-8 w-8" />,
  megaphone: <Megaphone className="h-8 w-8" />,
  palette: <Palette className="h-8 w-8" />,
  user: <User className="h-8 w-8" />,
  heart: <Heart className="h-8 w-8" />,
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
    <section className="relative py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <div className="max-w-xl">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Segmentos
            </span>
            <h2 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-3">
              Feito para o seu{' '}
              <span className="hero-gradient-text">objetivo</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Tecnologia, negócios, design, saúde e mais. Encontre o curso ideal para sua carreira.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/cursos?categoria=${category.name.toLowerCase().replace(' ', '-')}`}
                className="group relative flex flex-col items-start gap-4 p-5 sm:p-6 bg-card/40 backdrop-blur rounded-2xl border border-border/60 hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.5)] transition-all duration-300 h-full"
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_24px_hsl(var(--primary)/0.5)] transition-all">
                  {iconMap[category.icon || 'laptop'] || <Laptop className="h-7 w-7" />}
                </div>
                <h3 className="font-display font-bold text-sm sm:text-base tracking-tight">{category.name}</h3>
                <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
