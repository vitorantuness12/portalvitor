import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Save, Loader2, User, MessageSquare, Clock, CheckCircle, ChevronLeft, ChevronRight, Phone, Mail, CalendarDays, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useIsPwa } from '@/hooks/useIsPwa';
import { PwaLayout } from '@/components/pwa/PwaLayout';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPhoneBR, unformatPhone, isValidPhoneBR } from '@/lib/masks';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  whatsapp: z.string().refine((val) => val === '' || isValidPhoneBR(val), {
    message: 'WhatsApp inválido. Use o formato (99) 99999-9999',
  }),
});

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isPwa = useIsPwa();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [ticketPage, setTicketPage] = useState(0);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const ticketsPerPage = 5;

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['user-tickets', user?.id, ticketPage, ticketStatusFilter],
    queryFn: async () => {
      if (!user) return { tickets: [], total: 0 };
      let countQuery = supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      if (ticketStatusFilter !== 'all') countQuery = countQuery.eq('status', ticketStatusFilter);
      const { count } = await countQuery;
      let dataQuery = supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).range(ticketPage * ticketsPerPage, (ticketPage + 1) * ticketsPerPage - 1);
      if (ticketStatusFilter !== 'all') dataQuery = dataQuery.eq('status', ticketStatusFilter);
      const { data, error } = await dataQuery;
      if (error) throw error;
      return { tickets: data || [], total: count || 0 };
    },
    enabled: !!user,
  });

  const tickets = ticketsData?.tickets || [];
  const totalTickets = ticketsData?.total || 0;
  const totalPages = Math.ceil(totalTickets / ticketsPerPage);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setWhatsapp(profile.whatsapp ? formatPhoneBR(profile.whatsapp) : '');
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { full_name: string; whatsapp: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const validation = profileSchema.safeParse(data);
      if (!validation.success) throw new Error(validation.error.errors[0].message);
      const { error } = await supabase.from('profiles').update({ full_name: data.full_name, whatsapp: unformatPhone(data.whatsapp) || null }).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao atualizar perfil'),
  });

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Por favor, selecione uma imagem'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 2MB'); return; }
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: `${publicUrl}?t=${Date.now()}` }).eq('user_id', user.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao enviar foto');
    } finally { setIsUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); updateProfileMutation.mutate({ full_name: fullName, whatsapp }); };
  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => setWhatsapp(formatPhoneBR(e.target.value));

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="secondary" className="flex items-center gap-1 text-[10px] shrink-0"><Clock className="h-3 w-3" /> Aberto</Badge>;
      case 'in_progress': return <Badge className="bg-warning text-warning-foreground flex items-center gap-1 text-[10px] shrink-0"><MessageSquare className="h-3 w-3" /> Atendimento</Badge>;
      case 'closed': return <Badge className="bg-success text-success-foreground flex items-center gap-1 text-[10px] shrink-0"><CheckCircle className="h-3 w-3" /> Fechado</Badge>;
      default: return <Badge variant="outline" className="text-[10px] shrink-0">{status}</Badge>;
    }
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <PwaLayout>
      <div className={isPwa ? 'px-4 py-4 pb-28' : 'container mx-auto px-4 py-8 max-w-2xl pb-28'}>
        {!isPwa && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <PageHeader eyebrow="Conta" title="Meu Perfil" description="Atualize seus dados pessoais e preferências" />
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Identity / avatar block */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={isPwa ? 'border-border/50' : ''}>
              <CardContent className={isPwa ? 'p-4' : 'p-6'}>
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <Avatar className={isPwa ? 'h-20 w-20' : 'h-24 w-24 sm:h-28 sm:w-28'}>
                      <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Avatar'} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl">
                        {profile?.full_name ? getInitials(profile.full_name) : <User className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      aria-label="Alterar foto de perfil"
                      className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-soft"
                    >
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" aria-label="Selecionar imagem de perfil" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground">{profile?.full_name || 'Estudante'}</p>
                    <p className="text-xs text-muted-foreground">Toque no ícone para alterar a foto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Dados pessoais */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className={isPwa ? 'border-border/50' : ''}>
              <CardHeader className={isPwa ? 'p-4 pb-2' : 'pb-3'}>
                <CardTitle className={`flex items-center gap-2 ${isPwa ? 'text-sm' : 'text-base'}`}>
                  <User className="h-4 w-4 text-primary" />Dados Pessoais
                </CardTitle>
                {!isPwa && <CardDescription>Como você quer ser chamado na plataforma</CardDescription>}
              </CardHeader>
              <CardContent className={isPwa ? 'p-4 pt-0' : ''}>
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-xs">Nome Completo</Label>
                  <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" maxLength={100} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contato */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={isPwa ? 'border-border/50' : ''}>
              <CardHeader className={isPwa ? 'p-4 pb-2' : 'pb-3'}>
                <CardTitle className={`flex items-center gap-2 ${isPwa ? 'text-sm' : 'text-base'}`}>
                  <Phone className="h-4 w-4 text-primary" />Contato
                </CardTitle>
                {!isPwa && <CardDescription>Usado para notificações e suporte</CardDescription>}
              </CardHeader>
              <CardContent className={`space-y-4 ${isPwa ? 'p-4 pt-0' : ''}`}>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2 text-xs">
                    <Phone className="h-3.5 w-3.5" />WhatsApp
                  </Label>
                  <Input id="whatsapp" type="tel" value={whatsapp} onChange={handleWhatsappChange} placeholder="(99) 99999-9999" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5" />E-mail
                  </Label>
                  <Input id="email" value={profile?.email || user?.email || ''} disabled className="bg-muted" />
                  <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Conta */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className={isPwa ? 'border-border/50' : ''}>
              <CardHeader className={isPwa ? 'p-4 pb-2' : 'pb-3'}>
                <CardTitle className={`flex items-center gap-2 ${isPwa ? 'text-sm' : 'text-base'}`}>
                  <Settings2 className="h-4 w-4 text-primary" />Conta
                </CardTitle>
              </CardHeader>
              <CardContent className={isPwa ? 'p-4 pt-0' : ''}>
                {profile?.created_at ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Membro desde {format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Informações de conta indisponíveis</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Save button — inline no PWA (evita sobrepor a barra inferior), sticky no desktop */}
          <div className={isPwa ? 'pt-1' : 'sticky bottom-4 z-10'}>
            <Card className="shadow-elevated border-primary/20">
              <CardContent className="p-3">
                <Button type="submit" className="w-full" size="lg" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" />Salvar Alterações</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>

        {/* Support Tickets */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5">
          <Card className={isPwa ? 'border-border/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className={`flex items-center gap-2 ${isPwa ? 'text-base' : ''}`}>
                  <MessageSquare className="h-4 w-4 text-primary" />Suporte
                </CardTitle>
              </div>
              <Select value={ticketStatusFilter} onValueChange={(value) => { setTicketStatusFilter(value); setTicketPage(0); }}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Filtrar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abertos</SelectItem>
                  <SelectItem value="in_progress">Atendimento</SelectItem>
                  <SelectItem value="closed">Fechados</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {isLoadingTickets ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-2.5 w-1/4" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border/50 active:scale-[0.98] transition-transform cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/suporte/${ticket.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{ticket.subject}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </motion.div>
                  ))}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                      <p className="text-xs text-muted-foreground">{ticketPage + 1}/{totalPages}</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Página anterior" onClick={() => setTicketPage((p) => Math.max(0, p - 1))} disabled={ticketPage === 0}>
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Próxima página" onClick={() => setTicketPage((p) => Math.min(totalPages - 1, p + 1))} disabled={ticketPage >= totalPages - 1}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum ticket de suporte</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PwaLayout>
  );
}
