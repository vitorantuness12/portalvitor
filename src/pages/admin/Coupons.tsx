import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Ticket, Plus, Copy, Loader2, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  scope: string;
  scope_id: string | null;
  min_amount: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

const emptyForm = {
  id: '',
  code: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  min_amount: '0',
  max_uses: '',
  valid_until: '',
  is_active: true,
};

export default function AdminCoupons() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminCoupon[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const code = form.code.trim().toUpperCase();
      if (!code) throw new Error('Informe o código do cupom');
      const value = Number(form.discount_value);
      if (!value || value <= 0) throw new Error('Informe um desconto válido');
      if (form.discount_type === 'percent' && value > 100) {
        throw new Error('Desconto percentual não pode passar de 100%');
      }

      const payload = {
        code,
        description: form.description.trim() || null,
        discount_type: form.discount_type,
        discount_value: value,
        scope: 'all',
        scope_id: null,
        min_amount: Number(form.min_amount) || 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        is_active: form.is_active,
      };

      if (form.id) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Cupom salvo');
      setOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cupom removido');
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openEdit = (coupon: AdminCoupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description ?? '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_amount: String(coupon.min_amount ?? 0),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      valid_until: coupon.valid_until ? coupon.valid_until.slice(0, 10) : '',
      is_active: coupon.is_active,
    });
    setOpen(true);
  };

  const describeDiscount = (coupon: AdminCoupon) =>
    coupon.discount_type === 'percent'
      ? `${Number(coupon.discount_value)}% off`
      : `R$ ${Number(coupon.discount_value).toFixed(2).replace('.', ',')} off`;

  const copyCampaignMessage = (coupon: AdminCoupon) => {
    const validity = coupon.valid_until
      ? ` Válido até ${format(new Date(coupon.valid_until), "dd/MM/yyyy", { locale: ptBR })}.`
      : '';
    const message = `Olá {nome}! Use o cupom ${coupon.code} e garanta ${describeDiscount(coupon)} nos cursos da Formak.${validity} Acesse: https://formak.com.br/cursos`;
    navigator.clipboard.writeText(message);
    toast.success('Mensagem de campanha copiada — cole no WhatsApp');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campanhas"
        title="Cupons de desconto"
        description="Crie cupons com prazo e limite de uso e dispare a campanha pelo WhatsApp."
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo cupom
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : !coupons?.length ? (
        <EmptyState icon={Ticket} title="Nenhum cupom criado" description="Crie seu primeiro cupom promocional." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((coupon) => {
            const expired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
            const exhausted = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;
            return (
              <Card key={coupon.id} className="rounded-2xl">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold tracking-widest text-primary">
                        {coupon.code}
                      </p>
                      <p className="text-sm text-muted-foreground">{describeDiscount(coupon)}</p>
                    </div>
                    <Badge
                      variant={
                        !coupon.is_active || expired || exhausted ? 'secondary' : 'default'
                      }
                    >
                      {!coupon.is_active
                        ? 'Inativo'
                        : expired
                          ? 'Expirado'
                          : exhausted
                            ? 'Esgotado'
                            : 'Ativo'}
                    </Badge>
                  </div>

                  {coupon.description && (
                    <p className="text-sm text-muted-foreground">{coupon.description}</p>
                  )}

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      Usos: {coupon.used_count}
                      {coupon.max_uses ? ` / ${coupon.max_uses}` : ' (ilimitado)'}
                    </p>
                    <p>
                      Validade:{' '}
                      {coupon.valid_until
                        ? format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: ptBR })
                        : 'sem prazo'}
                    </p>
                    {coupon.min_amount > 0 && (
                      <p>Valor mínimo: R$ {Number(coupon.min_amount).toFixed(2).replace('.', ',')}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(coupon)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.code);
                        toast.success('Código copiado');
                      }}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Código
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyCampaignMessage(coupon)}>
                      <MessageCircle className="mr-1 h-4 w-4" />
                      Campanha
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Remover o cupom ${coupon.code}?`)) remove.mutate(coupon.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar cupom' : 'Novo cupom'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                className="uppercase"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="VOLTAAULAS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição interna</Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de desconto</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, discount_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor do desconto</Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount_value}
                  onChange={(e) => setForm((prev) => ({ ...prev, discount_value: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="min_amount">Valor mínimo (R$)</Label>
                <Input
                  id="min_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, min_amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite de usos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  placeholder="Ilimitado"
                  value={form.max_uses}
                  onChange={(e) => setForm((prev) => ({ ...prev, max_uses: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">Válido até</Label>
              <Input
                id="valid_until"
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm((prev) => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="coupon_active">Cupom ativo</Label>
              <Switch
                id="coupon_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar cupom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
