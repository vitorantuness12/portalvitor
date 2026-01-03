import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Send, Loader2, User, CheckCircle, Clock, MessageSquare, Phone } from 'lucide-react';
import { formatPhoneBR } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
    whatsapp: string | null;
  };
}

interface Message {
  id: string;
  content: string;
  is_from_admin: boolean;
  created_at: string;
  user_id: string;
}

export default function SupportTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch tickets with user profiles
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-support-tickets', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: ticketsData, error } = await query;
      if (error) throw error;

      // Fetch profiles for each ticket
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, whatsapp')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      return ticketsData.map(t => ({
        ...t,
        profiles: profilesMap.get(t.user_id),
      })) as Ticket[];
    },
  });

  // Fetch messages for selected ticket
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-support-messages', selectedTicket],
    queryFn: async () => {
      if (!selectedTicket) return [];
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', selectedTicket)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedTicket,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedTicket) return;

    const channel = supabase
      .channel(`admin-ticket-${selectedTicket}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selectedTicket}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedTicket] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, queryClient]);

  // Realtime subscription for new tickets
  useEffect(() => {
    const channel = supabase
      .channel('admin-new-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedTicket) throw new Error('Não autorizado');

      const ticket = tickets?.find((t) => t.id === selectedTicket);
      if (!ticket) throw new Error('Ticket não encontrado');

      const { error } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket,
        user_id: user.id,
        content,
        is_from_admin: true,
      });

      if (error) throw error;

      // Send push notification to user
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: ticket.user_id,
            title: 'Nova resposta do suporte',
            body: content.length > 100 ? content.substring(0, 100) + '...' : content,
            url: `/suporte/${selectedTicket}`,
          },
        });
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Don't fail the mutation if push notification fails
      }
    },
    onSuccess: () => {
      setInput('');
      queryClient.invalidateQueries({ queryKey: ['admin-support-messages', selectedTicket] });
    },
    onError: () => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      toast({
        title: 'Status atualizado',
        description: 'O status do ticket foi atualizado.',
      });
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessageMutation.mutate(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  const selectedTicketData = tickets?.find((t) => t.id === selectedTicket);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Suporte</h1>
          <p className="text-muted-foreground">Gerencie os tickets de suporte</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="in_progress">Em Atendimento</SelectItem>
            <SelectItem value="closed">Fechados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Tickets List */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Tickets</CardTitle>
          </CardHeader>
          <ScrollArea className="h-[calc(100%-60px)]">
            <CardContent className="p-2">
              {ticketsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <motion.button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedTicket === ticket.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm line-clamp-1">{ticket.subject}</span>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ticket.profiles?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), "dd/MM 'às' HH:mm")}
                      </p>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Headphones className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum ticket</p>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 overflow-hidden flex flex-col">
          {selectedTicket && selectedTicketData ? (
            <>
              {/* Header */}
              <CardHeader className="py-3 border-b flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedTicketData.subject}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedTicketData.profiles?.full_name} • {selectedTicketData.profiles?.email}
                  </p>
                  {selectedTicketData.profiles?.whatsapp && (
                    <a
                      href={`https://wa.me/55${selectedTicketData.profiles.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                    >
                      <Phone className="h-3 w-3" />
                      {formatPhoneBR(selectedTicketData.profiles.whatsapp)}
                    </a>
                  )}
                </div>
                <Select
                  value={selectedTicketData.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({ ticketId: selectedTicket, status: value })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="in_progress">Em Atendimento</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-3/4" />
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.is_from_admin ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.is_from_admin ? 'bg-primary/10' : 'bg-muted'
                          }`}
                        >
                          {message.is_from_admin ? (
                            <Headphones className="h-5 w-5 text-primary" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[75%] ${
                            message.is_from_admin
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'bg-muted text-foreground rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.is_from_admin ? 'opacity-70' : 'text-muted-foreground'}`}>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-sm mt-1">Envie uma mensagem para iniciar o atendimento.</p>
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              {selectedTicketData.status !== 'closed' && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua resposta..."
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sendMessageMutation.isPending || !input.trim()}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Headphones className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Selecione um ticket para visualizar</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
