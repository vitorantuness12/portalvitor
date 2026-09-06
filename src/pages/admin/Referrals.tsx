import { useQuery } from '@tanstack/react-query';
import { Gift, Users, CheckCircle2, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  code: string;
  status: string;
  created_at: string;
  converted_at: string | null;
}

interface RewardRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export default function AdminReferrals() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      const [referralsRes, rewardsRes] = await Promise.all([
        supabase
          .from('referrals')
          .select('id, referrer_id, referred_id, code, status, created_at, converted_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('referral_rewards').select('id, user_id, status, created_at').limit(1000),
      ]);

      if (referralsRes.error) throw referralsRes.error;
      if (rewardsRes.error) throw rewardsRes.error;

      const referrals = (referralsRes.data ?? []) as ReferralRow[];
      const rewards = (rewardsRes.data ?? []) as RewardRow[];

      const userIds = Array.from(
        new Set(referrals.flatMap((r) => [r.referrer_id, r.referred_id])),
      );

      let profiles: { user_id: string; full_name: string; email: string }[] = [];
      if (userIds.length) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        profiles = profilesData ?? [];
      }

      const nameById = new Map(profiles.map((p) => [p.user_id, p.full_name || p.email]));

      return { referrals, rewards, nameById };
    },
  });

  const referrals = data?.referrals ?? [];
  const rewards = data?.rewards ?? [];
  const converted = referrals.filter((r) => r.status === 'converted').length;
  const availableRewards = rewards.filter((r) => r.status === 'available').length;
  const usedRewards = rewards.filter((r) => r.status === 'used').length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Indicações"
        title="Programa de indicação"
        description="Acompanhe quem indicou, quem comprou e os cursos grátis concedidos."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { icon: Users, label: 'Indicações', value: referrals.length },
          { icon: CheckCircle2, label: 'Convertidas', value: converted },
          { icon: Gift, label: 'Prêmios disponíveis', value: availableRewards },
          { icon: Ticket, label: 'Prêmios usados', value: usedRewards },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <stat.icon className="mx-auto mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : !referrals.length ? (
        <EmptyState icon={Gift} title="Nenhuma indicação ainda" description="As indicações aparecerão aqui." />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {data?.nameById.get(referral.referrer_id) ?? 'Aluno'} indicou{' '}
                      {data?.nameById.get(referral.referred_id) ?? 'novo aluno'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Código {referral.code} ·{' '}
                      {format(new Date(referral.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant={referral.status === 'converted' ? 'default' : 'secondary'}>
                    {referral.status === 'converted' ? 'Compra confirmada' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
