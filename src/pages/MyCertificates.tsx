import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Award, Download, ExternalLink, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useIsPwa } from '@/hooks/useIsPwa';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Certificate {
  id: string;
  certificate_code: string;
  issued_at: string;
  course_id: string;
  courses: {
    title: string;
    duration_hours: number;
    thumbnail_url: string | null;
  };
}

export default function MyCertificates() {
  const { user } = useAuth();
  const isPwa = useIsPwa();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('certificates')
        .select(`id, certificate_code, issued_at, course_id, courses (title, duration_hours, thumbnail_url)`)
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data as Certificate[];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <PwaLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-display font-bold mb-2">Acesse sua conta</h2>
              <p className="text-muted-foreground mb-4">Faça login para visualizar seus certificados.</p>
              <Link to="/auth"><Button variant="hero">Entrar</Button></Link>
            </CardContent>
          </Card>
        </div>
      </PwaLayout>
    );
  }

  return (
    <PwaLayout>
      <div className={isPwa ? 'px-4 py-4' : 'container mx-auto px-4 py-6 sm:py-8'}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {!isPwa && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Link to="/meu-progresso" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
                  <ArrowLeft className="h-4 w-4" />Voltar ao progresso
                </Link>
                <h1 className="text-2xl sm:text-3xl font-display font-bold">Meus Certificados</h1>
                <p className="text-muted-foreground mt-1">
                  {certificates?.length || 0} certificado{certificates?.length !== 1 ? 's' : ''} conquistado{certificates?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {isPwa && (
            <p className="text-sm text-muted-foreground">
              {certificates?.length || 0} certificado{certificates?.length !== 1 ? 's' : ''}
            </p>
          )}

          {isLoading ? (
            <div className={isPwa ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-32 w-full mb-4" /><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
              ))}
            </div>
          ) : certificates && certificates.length > 0 ? (
            <div className={isPwa ? 'space-y-3' : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
              {certificates.map((cert, index) => (
                <motion.div key={cert.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                  <Card className={`overflow-hidden hover:shadow-lg transition-shadow group ${isPwa ? 'border-border/50' : ''}`}>
                    {!isPwa && (
                      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        {cert.courses.thumbnail_url && <img src={cert.courses.thumbnail_url} alt={cert.courses.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                        <Award className="h-16 w-16 text-primary relative z-10" />
                      </div>
                    )}
                    <CardContent className={isPwa ? 'p-3' : 'p-4'}>
                      {isPwa && (
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                            <Award className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-2">{cert.courses.title}</h3>
                        </div>
                      )}
                      {!isPwa && <h3 className="font-display font-semibold text-lg line-clamp-2 mb-3">{cert.courses.title}</h3>}
                      <div className={`space-y-1 text-muted-foreground mb-3 ${isPwa ? 'text-xs' : 'text-sm'}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(cert.issued_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{cert.courses.duration_hours}h</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/curso/${cert.course_id}/certificado`} className="flex-1">
                          <Button variant="hero" size="sm" className="w-full text-xs">
                            <Download className="h-3 w-3 mr-1" />Baixar
                          </Button>
                        </Link>
                        <Link to={`/validar-certificado?codigo=${cert.certificate_code}`}>
                          <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-display font-bold mb-2">Nenhum certificado ainda</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">Complete cursos com nota mínima de 7.0 para conquistar seus certificados.</p>
                <Link to="/cursos"><Button variant="hero">Explorar Cursos</Button></Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </PwaLayout>
  );
}
