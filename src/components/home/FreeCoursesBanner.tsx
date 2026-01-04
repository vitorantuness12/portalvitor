import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, GraduationCap, Clock, Award } from 'lucide-react';

export function FreeCoursesBanner() {
  const benefits = [
    { icon: GraduationCap, text: 'Acesso completo ao conteúdo' },
    { icon: Clock, text: 'Estude no seu ritmo' },
    { icon: Award, text: 'Certificado incluso' },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-6"
            >
              <Gift className="h-5 w-5" />
              <span className="font-semibold">100% Gratuito</span>
              <Sparkles className="h-4 w-4" />
            </motion.div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Comece sua jornada{' '}
              <span className="text-primary">sem gastar nada!</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Oferecemos cursos completamente gratuitos para você dar os primeiros passos 
              na sua capacitação profissional. Sem cartão de crédito, sem compromisso.
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 text-foreground"
                >
                  <div className="p-2 rounded-full bg-primary/10">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{benefit.text}</span>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <Link to="/cursos?price=free">
                <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                  <Gift className="mr-2 h-5 w-5" />
                  Ver Cursos Gratuitos
                </Button>
              </Link>
            </motion.div>

            {/* Trust text */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="mt-6 text-sm text-muted-foreground"
            >
              Já são mais de <span className="font-semibold text-foreground">500 alunos</span> aproveitando nossos cursos gratuitos
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
