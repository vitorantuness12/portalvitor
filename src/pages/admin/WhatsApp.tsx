import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  Loader2,
  Phone,
  MessageSquare,
  Users,
  Power,
  PowerOff,
  Smartphone,
  Search,
} from 'lucide-react';
import { formatPhoneBR } from '@/lib/masks';
import { useToast } from '@/hooks/use-toast';

type ConnectionState = 'open' | 'close' | 'connecting' | 'unknown';

export default function WhatsAppAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>('unknown');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [sendNumber, setSendNumber] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  const { data: statusData, refetch: refetchStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['evolution-status'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('evolution-api', {
          body: { action: 'status' },
        });
        if (error) throw error;
        return data;
      } catch (err: any) {
        console.error('Status fetch error:', err);
        toast({
          title: 'Erro de Conexão',
          description: err.message || 'Não foi possível obter o status do WhatsApp',
          variant: 'destructive',
        });
        return { success: false, data: { instance: { state: 'close' } } };
      }
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (statusData?.success && statusData?.data) {
      const state = statusData.data.instance?.state || statusData.data.state || 'unknown';
      setConnectionState(state);
      if (state === 'open') setQrCode(null);
    }
  }, [statusData]);

  const { data: students } = useQuery({
    queryKey: ['admin-students-whatsapp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, whatsapp')
        .order('full_name');
      if (error) throw error;
      return data;
    },
  });

  const filteredStudents = students?.filter(s => {
    if (!studentSearch) return true;
    const search = studentSearch.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search) ||
      s.whatsapp?.includes(search)
    );
  }) || [];

  const handleGenerateQR = async () => {
    setQrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'qrcode' },
      });
      if (error) throw error;
      if (data?.success && data?.data) {
        const base64 = data.data.base64 || data.data.qrcode?.base64 || null;
        if (base64) {
          setQrCode(base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`);
        } else {
          toast({ title: 'Dispositivo já conectado ou aguardando' });
          refetchStatus();
        }
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar QR Code', description: err.message, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };

  const restartMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'restart' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Instância reiniciada' });
      setTimeout(() => refetchStatus(), 3000);
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao reiniciar', description: err.message, variant: 'destructive' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'logout' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setConnectionState('close');
      setQrCode(null);
      toast({ title: 'Dispositivo desconectado' });
      refetchStatus();
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao desconectar', description: err.message, variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async ({ number, message }: { number: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'send-text', number, message },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Mensagem enviada com sucesso!' });
      setSendMessage('');
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao enviar mensagem', description: err.message, variant: 'destructive' });
    },
  });

  const handleSelectStudent = (userId: string) => {
    setSelectedStudentId(userId);
    const student = students?.find(s => s.user_id === userId);
    if (student?.whatsapp) setSendNumber(formatPhoneBR(student.whatsapp));
  };

  const handleSendMessage = () => {
    if (!sendNumber.trim() || !sendMessage.trim()) return;
    sendMutation.mutate({ number: sendNumber, message: sendMessage });
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'open': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'close': return 'bg-destructive';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusLabel = () => {
    switch (connectionState) {
      case 'open': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'close': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-primary" />
          WhatsApp - Evolution API
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie a conexão e envie mensagens diretamente pela plataforma.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor()} ${connectionState === 'connecting' ? 'animate-pulse' : ''}`} />
                <div>
                  <CardTitle className="text-lg">Status da Conexão</CardTitle>
                  <CardDescription>{getStatusLabel()}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchStatus()} disabled={statusLoading}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${statusLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                {connectionState === 'open' ? (
                  <Button variant="destructive" size="sm" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                    {logoutMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PowerOff className="h-4 w-4 mr-1" />}
                    Desconectar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => restartMutation.mutate()} disabled={restartMutation.isPending}>
                    {restartMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Power className="h-4 w-4 mr-1" />}
                    Reiniciar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <Tabs defaultValue={connectionState !== 'open' ? 'connect' : 'send'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connect" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Conectar Dispositivo
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Enviar Mensagem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connect">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Conectar Dispositivo
              </CardTitle>
              <CardDescription>Escaneie o QR Code com o WhatsApp do seu celular.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              {connectionState === 'open' ? (
                <div className="flex flex-col items-center gap-4">
                  <Wifi className="h-12 w-12 text-green-500" />
                  <p className="font-semibold">Dispositivo Conectado</p>
                </div>
              ) : (
                <>
                  {qrCode ? (
                    <div className="p-4 bg-white rounded-lg shadow-sm border">
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                      <WifiOff className="h-12 w-12 opacity-20" />
                      <p className="text-sm">Gere um QR Code para iniciar a conexão.</p>
                    </div>
                  )}
                  <Button onClick={handleGenerateQR} disabled={qrLoading}>
                    {qrLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {qrCode ? 'Gerar Novo QR Code' : 'Gerar QR Code'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar aluno..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <ScrollArea className="h-[400px]">
                <div className="p-4 pt-0 space-y-2">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.user_id}
                      onClick={() => handleSelectStudent(s.user_id)}
                      className={`w-full text-left p-2 rounded text-sm transition-colors ${selectedStudentId === s.user_id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                    >
                      <div className="font-medium">{s.full_name}</div>
                      <div className="text-xs opacity-70">{s.whatsapp || 'Sem número'}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Enviar Mensagem</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Número (WhatsApp)</Label>
                  <Input value={sendNumber} onChange={(e) => setSendNumber(e.target.value)} placeholder="55..." />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                  />
                </div>
                <Button className="w-full" onClick={handleSendMessage} disabled={sendMutation.isPending || !sendNumber || !sendMessage}>
                  {sendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar via WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
