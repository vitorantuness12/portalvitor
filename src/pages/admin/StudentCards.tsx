import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Truck,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type StudentCardWithProfile = {
  id: string;
  user_id: string;
  card_code: string;
  photo_url: string | null;
  plan_type: 'digital' | 'printed';
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled';
  shipping_address: Record<string, string> | null;
  shipping_status: 'pending' | 'processing' | 'shipped' | 'delivered' | null;
  issued_at: string | null;
  expires_at: string | null;
  paid_at: string | null;
  amount_paid: number | null;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
};

const statusConfig = {
  pending_payment: {
    label: 'Aguardando Pagamento',
    color: 'bg-amber-500/10 text-amber-500',
    icon: Clock,
  },
  active: {
    label: 'Ativa',
    color: 'bg-emerald-500/10 text-emerald-500',
    icon: CheckCircle,
  },
  expired: {
    label: 'Expirada',
    color: 'bg-red-500/10 text-red-500',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-gray-500/10 text-gray-500',
    icon: XCircle,
  },
};

const shippingStatusConfig = {
  pending: { label: 'Aguardando', color: 'bg-gray-500/10 text-gray-500', icon: Package },
  processing: { label: 'Em Preparação', color: 'bg-blue-500/10 text-blue-500', icon: Package },
  shipped: { label: 'Enviado', color: 'bg-amber-500/10 text-amber-500', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle },
};

export default function AdminStudentCards() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCard, setSelectedCard] = useState<StudentCardWithProfile | null>(null);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['admin-student-cards'],
    queryFn: async () => {
      const { data: cardsData, error: cardsError } = await (supabase
        .from('student_cards') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Fetch profiles for each card
      const userIds = [...new Set(cardsData?.map((c: any) => c.user_id as string) || [])] as string[];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return cardsData?.map((card) => ({
        ...card,
        profile: profileMap.get(card.user_id),
      })) as StudentCardWithProfile[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      cardId,
      status,
      shippingStatus,
    }: {
      cardId: string;
      status?: 'pending_payment' | 'active' | 'expired' | 'cancelled';
      shippingStatus?: 'pending' | 'processing' | 'shipped' | 'delivered';
    }) => {
      const updates: Record<string, unknown> = {};
      
      if (status) {
        updates.status = status;
        if (status === 'active') {
          updates.issued_at = new Date().toISOString();
          updates.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          updates.paid_at = new Date().toISOString();
        }
      }
      
      if (shippingStatus) {
        updates.shipping_status = shippingStatus;
      }

      const { error } = await (supabase
        .from('student_cards') as any)
        .update(updates)
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-student-cards'] });
      toast.success('Carteirinha atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar carteirinha');
    },
  });

  const filteredCards = cards?.filter((card) => {
    const matchesSearch =
      card.card_code.toLowerCase().includes(search.toLowerCase()) ||
      card.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      card.profile?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: cards?.length || 0,
    active: cards?.filter((c) => c.status === 'active').length || 0,
    pending: cards?.filter((c) => c.status === 'pending_payment').length || 0,
    revenue: cards?.filter((c) => c.status === 'active').reduce((acc, c) => acc + (c.amount_paid || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold">Carteirinhas de Estudante</h1>
        <p className="text-muted-foreground">Gerencie as carteirinhas emitidas</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-emerald-500">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold">R$ {stats.revenue.toFixed(2).replace('.', ',')}</p>
              </div>
              <CreditCard className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, nome ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : filteredCards?.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma carteirinha encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Envio</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards?.map((card) => {
                    const StatusIcon = statusConfig[card.status].icon;
                    const ShippingIcon = card.shipping_status
                      ? shippingStatusConfig[card.shipping_status].icon
                      : null;

                    return (
                      <TableRow key={card.id}>
                        <TableCell>
                          <span className="font-mono font-medium">{card.card_code}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{card.profile?.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{card.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {card.plan_type === 'digital' ? 'Digital' : 'Impresso'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[card.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[card.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {card.plan_type === 'printed' && card.shipping_status ? (
                            <Badge className={shippingStatusConfig[card.shipping_status].color}>
                              {ShippingIcon && <ShippingIcon className="h-3 w-3 mr-1" />}
                              {shippingStatusConfig[card.shipping_status].label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(card.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCard(card)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {card.status === 'pending_payment' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ cardId: card.id, status: 'active' })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                  Ativar Carteirinha
                                </DropdownMenuItem>
                              )}
                              {card.status === 'active' && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({ cardId: card.id, status: 'cancelled' })
                                  }
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              {card.plan_type === 'printed' && card.status === 'active' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        cardId: card.id,
                                        shippingStatus: 'processing',
                                      })
                                    }
                                  >
                                    <Package className="h-4 w-4 mr-2" />
                                    Em Preparação
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        cardId: card.id,
                                        shippingStatus: 'shipped',
                                      })
                                    }
                                  >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Marcar como Enviado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        cardId: card.id,
                                        shippingStatus: 'delivered',
                                      })
                                    }
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Marcar como Entregue
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Carteirinha</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4">
              {/* Photo */}
              <div className="flex justify-center">
                {selectedCard.photo_url ? (
                  <img
                    src={selectedCard.photo_url}
                    alt="Foto"
                    className="w-24 h-32 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-32 rounded-lg bg-muted flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Código</p>
                  <p className="font-mono font-medium">{selectedCard.card_code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={statusConfig[selectedCard.status].color}>
                    {statusConfig[selectedCard.status].label}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Aluno</p>
                  <p className="font-medium">{selectedCard.profile?.full_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium">
                    R$ {selectedCard.amount_paid?.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                {selectedCard.expires_at && (
                  <div>
                    <p className="text-muted-foreground">Validade</p>
                    <p className="font-medium">
                      {format(new Date(selectedCard.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              {selectedCard.plan_type === 'printed' && selectedCard.shipping_address && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Endereço de Entrega</p>
                  <p className="text-sm">
                    {selectedCard.shipping_address.street}, {selectedCard.shipping_address.number}
                    {selectedCard.shipping_address.complement &&
                      ` - ${selectedCard.shipping_address.complement}`}
                    <br />
                    {selectedCard.shipping_address.neighborhood} - {selectedCard.shipping_address.city}/
                    {selectedCard.shipping_address.state}
                    <br />
                    CEP: {selectedCard.shipping_address.zipCode}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
