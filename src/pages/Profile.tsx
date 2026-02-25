import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Save, Loader2, User, MessageSquare, Clock, CheckCircle, ExternalLink, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { useIsPwa } from '@/hooks/useIsPwa';
import { PwaBottomNav } from '@/components/pwa/PwaBottomNav';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatPhoneBR, unformatPhone, isValidPhoneBR } from '@/lib/masks';

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
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['user-tickets', user?.id, ticketPage, ticketStatusFilter],
    queryFn: async () => {
      if (!user) return { tickets: [], total: 0 };
      
      // Build base query for count
      let countQuery = supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (ticketStatusFilter !== 'all') {
        countQuery = countQuery.eq('status', ticketStatusFilter);
      }
      
      const { count } = await countQuery;
      
      // Build paginated query
      let dataQuery = supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(ticketPage * ticketsPerPage, (ticketPage + 1) * ticketsPerPage - 1);
      
      if (ticketStatusFilter !== 'all') {
        dataQuery = dataQuery.eq('status', ticketStatusFilter);
      }
      
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
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: data.full_name,
          whatsapp: unformatPhone(data.whatsapp) || null,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar perfil');
    },
  });

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      toast.success('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ full_name: fullName, whatsapp });
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhoneBR(e.target.value));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Aberto</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning text-warning-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Em Atendimento</Badge>;
      case 'closed':
        return <Badge className="bg-success text-success-foreground flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${isPwa ? 'pt-4 pb-24' : 'py-8'}`}>
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Atualize suas informações pessoais
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize sua foto e dados de perfil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                        <AvatarImage 
                          src={profile?.avatar_url || undefined} 
                          alt={profile?.full_name || 'Avatar'} 
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl sm:text-3xl">
                          {profile?.full_name ? getInitials(profile.full_name) : <User className="h-8 w-8" />}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clique no ícone para alterar a foto
                    </p>
                  </div>

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      maxLength={100}
                    />
                  </div>

                  {/* WhatsApp Field */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      placeholder="(99) 99999-9999"
                    />
                  </div>

                  {/* Email Field (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      value={profile?.email || user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O e-mail não pode ser alterado
                    </p>
                  </div>

                  {/* Member Since */}
                  {profile?.created_at && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Membro desde{' '}
                        {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Support Tickets History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Histórico de Suporte
                  </CardTitle>
                  <CardDescription>
                    Seus tickets de atendimento
                  </CardDescription>
                </div>
                <Select 
                  value={ticketStatusFilter} 
                  onValueChange={(value) => {
                    setTicketStatusFilter(value);
                    setTicketPage(0);
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="open">Abertos</SelectItem>
                    <SelectItem value="in_progress">Em Atendimento</SelectItem>
                    <SelectItem value="closed">Fechados</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {isLoadingTickets ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : tickets && tickets.length > 0 ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ticket.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(ticket.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/suporte/${ticket.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                        <p className="text-sm text-muted-foreground">
                          Página {ticketPage + 1} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketPage((p) => Math.max(0, p - 1))}
                            disabled={ticketPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={ticketPage >= totalPages - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhum ticket de suporte</p>
                    <p className="text-sm">Seus tickets aparecerão aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      {isPwa ? <PwaBottomNav /> : <Footer />}
    </div>
  );
}
