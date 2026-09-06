import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Copy, Gift, Loader2, Share2, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { Seo } from '@/components/seo/Seo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { publicUrl } from '@/lib/site';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Referrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['referral-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: referrals } = useQuery({
    queryKey: ['my-referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('id, status, created_at, converted_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: rewards } = useQuery({
    queryKey: ['my-referral-rewards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('id, status, reason, expires_at, used_at, used_course_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: courses } = useQuery({
    queryKey: ['referral-redeemable-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('status', 'active')
        .order('title');
      if (error) throw error;
      return data ?? [];
    },
  });

  const availableRewards = (rewards ?? []).filter((r) => r.status === 'available');

  const redeem = useMutation({
    mutationFn: async () => {
      if (!selectedCourse) throw new Error('Escolha um curso');
      const { data, error } = await supabase.functions.invoke('redeem-referral-reward', {
        body: { courseId: selectedCourse },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Curso liberado gratuitamente!');
      setSelectedCourse('');
      queryClient.invalidateQueries({ queryKey: ['my-referral-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const code = profile?.referral_code ?? '';
  const shareLink = code ? publicUrl(`/auth?ref=${code}`) : '';

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado!`);
  };

  const share = async () => {
    if (navigator.share && shareLink) {
      try {
        await navigator.share({
          title: 'Estude comigo na Formak',
          text: 'Use meu código e comece seus cursos na Formak:',
          url: shareLink,
        });
        return;
      } catch {
        /* usuário cancelou */
      }
    }
    copy(shareLink, 'Link');
  };

  if (!user) {
    return (
      <PwaLayout>
        <div className="container mx-auto px-4 py-12">
          <EmptyState
            icon={Gift}
            title="Entre para indicar amigos"
            description="Faça login para pegar seu código de indicação e ganhar cursos grátis."
            action={
              <Button asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
            }
          />
        </div>
      </PwaLayout>
    );
  }

  return (
    <PwaLayout>
      <Seo
        title="Programa de indicação"
        description="Indique amigos para a Formak e ganhe cursos grátis a cada indicação que virar matrícula."
        path="/indicacoes"
        noIndex
      />

      <div className="container mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-10">
        <PageHeader
          eyebrow="Indicações"
          title="Indique e ganhe cursos grátis"
          description="Compartilhe seu código. Quando seu amigo fizer a primeira compra, você ganha um curso gratuito."
        />

        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-5">
            {loadingProfile ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Seu código</p>
                  <p className="font-display text-3xl font-bold tracking-[0.2em] text-primary">{code}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" className="flex-1" onClick={() => copy(code, 'Código')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar código
                  </Button>
                  <Button className="flex-1" onClick={share}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartilhar link
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{referrals?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Indicados</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
              <p className="text-2xl font-bold">
                {(referrals ?? []).filter((r) => r.status === 'converted').length}
              </p>
              <p className="text-xs text-muted-foreground">Compraram</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <Gift className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{availableRewards.length}</p>
              <p className="text-xs text-muted-foreground">Cursos grátis</p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-lg font-bold">Resgatar curso grátis</h2>
            {availableRewards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você ainda não tem cursos grátis disponíveis. Compartilhe seu código para ganhar.
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Escolha um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses ?? []).map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => redeem.mutate()}
                  disabled={!selectedCourse || redeem.isPending}
                >
                  {redeem.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Gift className="mr-2 h-4 w-4" />
                  )}
                  Resgatar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="space-y-3 p-5">
            <h2 className="font-display text-lg font-bold">Histórico de indicações</h2>
            {!referrals?.length ? (
              <p className="text-sm text-muted-foreground">Nenhuma indicação ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {referrals.map((referral) => (
                  <li key={referral.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-muted-foreground">
                      {format(new Date(referral.created_at), "dd 'de' MMM yyyy", { locale: ptBR })}
                    </span>
                    <Badge variant={referral.status === 'converted' ? 'default' : 'secondary'}>
                      {referral.status === 'converted' ? 'Compra confirmada' : 'Aguardando compra'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </PwaLayout>
  );
}
