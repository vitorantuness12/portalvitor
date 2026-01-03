import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, User, Headphones, CheckCircle, Bell, BellOff } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Message {
  id: string;
  content: string;
  is_from_admin: boolean;
  created_at: string;
  user_id: string;
}

export default function SupportTicket() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSupported, isSubscribed, isLoading: notifLoading, requestPermission, unsubscribe } = usePushNotifications();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Fetch ticket
  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['support-ticket', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['support-messages', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!id && !!user,
  });

  // Realtime subscription for messages
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`ticket-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['support-messages', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !ticket) throw new Error('Não autorizado');

      const { error } = await supabase.from('support_messages').insert({
        ticket_id: id,
        user_id: user.id,
        content,
        is_from_admin: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setInput('');
      queryClient.invalidateQueries({ queryKey: ['support-messages', id] });
    },
    onError: () => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente.',
        variant: 'destructive',
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
        return <Badge variant="secondary">Aberto</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning text-warning-foreground">Em Atendimento</Badge>;
      case 'closed':
        return <Badge className="bg-success text-success-foreground">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || ticketLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Ticket não encontrado</h1>
            <Button onClick={() => navigate('/meus-cursos')}>Voltar</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/meus-cursos')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-semibold truncate">{ticket.subject}</h1>
                  <p className="text-sm text-muted-foreground">
                    Criado em {format(new Date(ticket.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSupported && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isSubscribed ? unsubscribe : requestPermission}
                      disabled={notifLoading}
                    >
                      {isSubscribed ? (
                        <>
                          <BellOff className="h-4 w-4 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Notificar
                        </>
                      )}
                    </Button>
                  )}
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[400px] p-4">
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
                        className={`flex gap-3 ${message.is_from_admin ? '' : 'flex-row-reverse'}`}
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
                              ? 'bg-muted text-foreground rounded-tl-none'
                              : 'bg-primary text-primary-foreground rounded-tr-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <p className={`text-xs mt-1 ${message.is_from_admin ? 'text-muted-foreground' : 'opacity-70'}`}>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={scrollRef} />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aguardando atendimento...</p>
                    <p className="text-sm mt-1">Em breve um atendente irá responder.</p>
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              {ticket.status !== 'closed' ? (
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem..."
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
              ) : (
                <div className="p-4 border-t border-border bg-success/5 flex items-center justify-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span>Este ticket foi encerrado</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
