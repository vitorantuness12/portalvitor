import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, CheckCircle, Clock, Layers, Loader2, Play, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { PaymentCheckout } from '@/components/payment/PaymentCheckout';
import { CourseImage } from '@/components/courses/CourseImage';
import { Seo } from '@/components/seo/Seo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatPrice } from './Tracks';

interface TrackCourseRow {
  course_id: string;
  position: number;
  courses: {
    id: string;
    title: string;
    price: number;
    duration_hours: number;
    thumbnail_url: string | null;
  } | null;
}

interface TrackDetailData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number;
  original_price: number | null;
  track_courses: TrackCourseRow[];
}

export default function TrackDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);

  const { data: track, isLoading } = useQuery({
    queryKey: ['learning-track', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_tracks')
        .select(
          'id, title, slug, description, thumbnail_url, price, original_price, track_courses (course_id, position, courses (id, title, price, duration_hours, thumbnail_url))',
        )
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data as TrackDetailData | null;
    },
    enabled: !!slug,
  });

  const courses = (track?.track_courses ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((tc) => tc.courses)
    .filter(Boolean) as NonNullable<TrackCourseRow['courses']>[];

  const { data: enrollments } = useQuery({
    queryKey: ['track-enrollments', track?.id, user?.id],
    queryFn: async () => {
      if (!user || !courses.length) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id, status, progress')
        .eq('user_id', user.id)
        .in('course_id', courses.map((c) => c.id));
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!track && courses.length > 0,
  });

  const { data: trackCertificate } = useQuery({
    queryKey: ['track-certificate', track?.id, user?.id],
    queryFn: async () => {
      if (!user || !track) return null;
      const { data, error } = await supabase
        .from('track_certificates')
        .select('certificate_code, issued_at')
        .eq('user_id', user.id)
        .eq('track_id', track.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!track,
  });

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id));
  const completedCount = (enrollments ?? []).filter((e) =>
    ['completed', 'passed'].includes(e.status),
  ).length;
  const hasFullAccess = courses.length > 0 && courses.every((c) => enrolledIds.has(c.id));
  const progressPercent = courses.length ? Math.round((completedCount / courses.length) * 100) : 0;
  const sumIndividual = courses.reduce((acc, c) => acc + Number(c.price || 0), 0);
  const savings = Math.max(sumIndividual - Number(track?.price ?? 0), 0);

  const issueCertificate = useMutation({
    mutationFn: async () => {
      if (!track) throw new Error('Trilha não encontrada');
      const { data, error } = await supabase.rpc('issue_track_certificate', { _track_id: track.id });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string; code?: string };
      if (!result?.success) throw new Error(result?.error || 'Não foi possível emitir o certificado');
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Certificado da trilha emitido: ${result.code}`);
      queryClient.invalidateQueries({ queryKey: ['track-certificate'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <PwaLayout>
        <div className="container mx-auto space-y-4 px-4 py-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      </PwaLayout>
    );
  }

  if (!track) {
    return (
      <PwaLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Trilha não encontrada</h1>
          <Button asChild className="mt-4">
            <Link to="/trilhas">Ver todas as trilhas</Link>
          </Button>
        </div>
      </PwaLayout>
    );
  }

  return (
    <PwaLayout>
      <Seo
        title={track.title}
        description={track.description || `Trilha ${track.title}: ${courses.length} cursos com desconto e certificado de trilha.`}
        path={`/trilha/${track.slug}`}
      />

      <div className="container mx-auto space-y-6 px-4 py-6 sm:py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted">
                <CourseImage
                  thumbnailUrl={track.thumbnail_url}
                  alt={track.title}
                  className="h-full w-full object-cover"
                />
                <Badge className="absolute left-4 top-4 gap-1">
                  <Layers className="h-3 w-3" />
                  {courses.length} cursos
                </Badge>
              </div>
            </motion.div>

            <div className="space-y-3">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{track.title}</h1>
              {track.description && (
                <p className="leading-relaxed text-muted-foreground">{track.description}</p>
              )}
            </div>

            {hasFullAccess && (
              <Card className="rounded-2xl">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Progresso da trilha</span>
                    <span className="text-muted-foreground">
                      {completedCount} de {courses.length} concluídos
                    </span>
                  </div>
                  <Progress value={progressPercent} />
                  {trackCertificate ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <Award className="h-4 w-4" />
                      Certificado da trilha: <strong>{trackCertificate.certificate_code}</strong>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={progressPercent < 100 || issueCertificate.isPending}
                      onClick={() => issueCertificate.mutate()}
                    >
                      {issueCertificate.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Award className="mr-2 h-4 w-4" />
                      )}
                      {progressPercent < 100
                        ? 'Conclua todos os cursos para liberar o certificado'
                        : 'Emitir certificado da trilha'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold">Cursos incluídos</h2>
              {courses.map((course, index) => {
                const enrolled = enrolledIds.has(course.id);
                return (
                  <Card key={course.id} className="rounded-2xl">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <CourseImage
                          thumbnailUrl={course.thumbnail_url}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{course.title}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {course.duration_hours}h
                        </p>
                      </div>
                      {enrolled ? (
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/curso/${course.id}/estudar`}>
                            <Play className="mr-1 h-4 w-4" />
                            Estudar
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/curso/${course.id}`}>Ver</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 rounded-2xl">
              <CardContent className="space-y-4 p-5">
                <div>
                  {track.original_price && track.original_price > track.price && (
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(track.original_price)}
                    </p>
                  )}
                  <p className="text-3xl font-bold text-primary">{formatPrice(track.price)}</p>
                  {savings > 0 && (
                    <p className="text-sm text-emerald-600">
                      Economia de {formatPrice(savings)} em relação aos cursos avulsos
                    </p>
                  )}
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {courses.length} cursos com acesso imediato
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Certificado de cada curso
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Certificado extra da trilha
                  </li>
                </ul>

                {hasFullAccess ? (
                  <Button className="w-full" asChild>
                    <Link to="/meus-cursos">Ir para meus cursos</Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!user) {
                        navigate('/auth');
                        return;
                      }
                      setShowPayment(true);
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Comprar trilha
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Comprar trilha</DialogTitle>
          </DialogHeader>
          <PaymentCheckout
            referenceType="track"
            referenceId={track.id}
            amount={Number(track.price)}
            description={`Trilha: ${track.title}`}
            onSuccess={() => {
              setShowPayment(false);
              queryClient.invalidateQueries({ queryKey: ['track-enrollments'] });
              toast.success('Trilha liberada! Bons estudos.');
              navigate('/meus-cursos');
            }}
            onCancel={() => setShowPayment(false)}
          />
        </DialogContent>
      </Dialog>
    </PwaLayout>
  );
}
