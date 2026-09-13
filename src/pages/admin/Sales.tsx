import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BookCheck,
  Clock3,
  RefreshCw,
  Search,
  ShoppingBag,
  WalletCards,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CourseSale {
  id: string;
  userId: string;
  courseId: string;
  buyerName: string;
  buyerEmail: string;
  courseTitle: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

interface SalesMetricProps {
  label: string;
  value: string | number;
  icon: typeof ShoppingBag;
  tone: 'primary' | 'warning' | 'success' | 'info';
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Liberado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const methodLabels: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function SalesMetric({ label, value, icon: Icon, tone }: SalesMetricProps) {
  const toneClasses = {
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4 sm:p-5">
        <div className={`rounded-lg p-2.5 ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SaleStatus({ status }: { status: string }) {
  const variant = status === 'approved'
    ? 'default'
    : status === 'rejected'
      ? 'destructive'
      : status === 'pending'
        ? 'secondary'
        : 'outline';

  return <Badge variant={variant}>{statusLabels[status] ?? status}</Badge>;
}

async function fetchCourseSales(): Promise<CourseSale[]> {
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, user_id, reference_id, amount, payment_method, status, created_at, paid_at')
    .eq('reference_type', 'course')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!payments?.length) return [];

  const userIds = [...new Set(payments.map((payment) => payment.user_id))];
  const courseIds = [...new Set(payments.map((payment) => payment.reference_id))];
  const [profilesResult, coursesResult] = await Promise.all([
    supabase.from('profiles').select('user_id, full_name, email').in('user_id', userIds),
    supabase.from('courses').select('id, title').in('id', courseIds),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (coursesResult.error) throw coursesResult.error;

  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.user_id, profile]));
  const courses = new Map((coursesResult.data ?? []).map((course) => [course.id, course.title]));

  return payments.map((payment) => {
    const profile = profiles.get(payment.user_id);
    return {
      id: payment.id,
      userId: payment.user_id,
      courseId: payment.reference_id,
      buyerName: profile?.full_name ?? 'Aluno não identificado',
      buyerEmail: profile?.email ?? '',
      courseTitle: courses.get(payment.reference_id) ?? 'Curso não disponível',
      amount: Number(payment.amount),
      method: payment.payment_method,
      status: payment.status,
      createdAt: payment.created_at,
      paidAt: payment.paid_at,
    };
  });
}

export default function AdminSales() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data: sales = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-course-sales'],
    queryFn: fetchCourseSales,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-course-sales')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: 'reference_type=eq.course' },
        () => queryClient.invalidateQueries({ queryKey: ['admin-course-sales'] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const summary = useMemo(() => {
    const released = sales.filter((sale) => sale.status === 'approved');
    return {
      total: sales.length,
      pending: sales.filter((sale) => sale.status === 'pending').length,
      released: released.length,
      revenue: released.reduce((total, sale) => total + sale.amount, 0),
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return sales.filter((sale) => {
      const matchesStatus = status === 'all' || sale.status === status;
      const matchesSearch = !term || [sale.buyerName, sale.buyerEmail, sale.courseTitle]
        .some((value) => value.toLocaleLowerCase('pt-BR').includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [sales, search, status]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Vendas de cursos</h1>
            <span className="flex items-center gap-1 text-xs font-medium text-success">
              <span className="h-2 w-2 rounded-full bg-success" /> Ao vivo
            </span>
          </div>
          <p className="text-muted-foreground">Acompanhe compras, pendências e acessos liberados.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumo das vendas">
        <SalesMetric label="Cursos comprados" value={summary.total} icon={ShoppingBag} tone="primary" />
        <SalesMetric label="Pendentes" value={summary.pending} icon={Clock3} tone="warning" />
        <SalesMetric label="Liberados" value={summary.released} icon={BookCheck} tone="success" />
        <SalesMetric label="Receita confirmada" value={formatCurrency(summary.revenue)} icon={WalletCards} tone="info" />
      </section>

      <section className="space-y-4" aria-label="Lista de vendas">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar aluno, e-mail ou curso"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="approved">Liberados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
              <SelectItem value="refunded">Reembolsados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
              </div>
            ) : isError ? (
              <div className="p-10 text-center">
                <p className="font-medium">Não foi possível carregar as vendas.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Tentar novamente</Button>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <ShoppingBag className="mx-auto mb-3 h-10 w-10" />
                <p>Nenhuma venda de curso encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <p className="whitespace-nowrap font-medium">{sale.buyerName}</p>
                          <p className="whitespace-nowrap text-xs text-muted-foreground">{sale.buyerEmail}</p>
                        </TableCell>
                        <TableCell className="min-w-56 font-medium">{sale.courseTitle}</TableCell>
                        <TableCell className="whitespace-nowrap">{methodLabels[sale.method] ?? sale.method}</TableCell>
                        <TableCell className="whitespace-nowrap font-semibold">{formatCurrency(sale.amount)}</TableCell>
                        <TableCell><SaleStatus status={sale.status} /></TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {format(new Date(sale.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}