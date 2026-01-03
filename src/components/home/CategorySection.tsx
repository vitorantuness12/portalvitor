import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Laptop, Briefcase, Megaphone, Palette, User, Heart } from 'lucide-react';
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
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Explore por Categoria
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre o curso ideal para seus objetivos profissionais
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/cursos?categoria=${category.name.toLowerCase().replace(' ', '-')}`}
                className="group flex flex-col items-center gap-4 p-6 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {iconMap[category.icon || 'laptop'] || <Laptop className="h-8 w-8" />}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">{category.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
