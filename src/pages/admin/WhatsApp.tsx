import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle2,
  XCircle,
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
  const [connectionState, setConnectionState] = useState<ConnectionState>('unknown');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Send message state
  const [sendNumber, setSendNumber] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch connection status
  const { data: statusData, refetch: refetchStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['evolution-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'status' },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (statusData?.success && statusData?.data) {
      const state = statusData.data.instance?.state || statusData.data.state || 'unknown';
      setConnectionState(state);
      if (state === 'open') {
        setQrCode(null);
      }
    }
  }, [statusData]);

  // Fetch students
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

  // Generate QR Code
  const handleGenerateQR = async () => {
    setQrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-api', {
        body: { action: 'qrcode' },
      });
      if (error) throw error;

      if (data?.success && data?.data) {
        const base64 = data.data.base64 || data.data.qrcode?.base64 || null;
        const pairingCode = data.data.pairingCode || data.data.code || null;
        
        if (base64) {
          setQrCode(base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`);
        } else if (pairingCode) {
          setQrCode(null);
          toast({ title: 'Código de pareamento', description: pairingCode });
        } else {
          // If already connected
          toast({ title: 'Dispositivo já conectado!' });
          refetchStatus();
        }
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar QR Code', description: err.message, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };

  // Restart instance
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

  // Logout
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

  // Send message
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
    if (student?.whatsapp) {
      setSendNumber(formatPhoneBR(student.whatsapp));
    }
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-primary" />
          WhatsApp - Evolution API
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie a conexão e envie mensagens diretamente pela plataforma.
        </p>
      </div>

      {/* Connection Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${getStatusColor()} animate-pulse`} />
                <div>
                  <CardTitle className="text-lg">Status da Conexão</CardTitle>
                  <CardDescription>{getStatusLabel()}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchStatus()}
                  disabled={statusLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${statusLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                {connectionState === 'open' ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <PowerOff className="h-4 w-4 mr-1" />
                    )}
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restartMutation.mutate()}
                    disabled={restartMutation.isPending}
                  >
                    {restartMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Power className="h-4 w-4 mr-1" />
                    )}
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

        {/* QR Code Tab */}
        <TabsContent value="connect">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Conectar Dispositivo
                </CardTitle>
                <CardDescription>
                  Escaneie o QR Code com o WhatsApp do seu celular para conectar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {connectionState === 'open' ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Wifi className="h-10 w-10 text-green-500" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">Dispositivo Conectado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Seu WhatsApp está conectado e pronto para enviar mensagens.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    {qrCode ? (
                      <div className="p-4 bg-white rounded-2xl shadow-lg">
                        <img
                          src={qrCode}
                          alt="QR Code WhatsApp"
                          className="w-64 h-64 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                          <WifiOff className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                          Clique no botão abaixo para gerar o QR Code. Depois, abra o WhatsApp no celular,
                          vá em <strong>Dispositivos conectados</strong> e escaneie o código.
                        </p>
                      </div>
                    )}

                    <Button
                      size="lg"
                      onClick={handleGenerateQR}
                      disabled={qrLoading}
                    >
                      {qrLoading ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-5 w-5 mr-2" />
                      )}
                      {qrCode ? 'Gerar Novo QR Code' : 'Gerar QR Code'}
                    </Button>

                    {qrCode && (
                      <p className="text-xs text-muted-foreground text-center">
                        O QR Code expira rapidamente. Se não funcionar, gere um novo.
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Como conectar:</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 shrink-0">1</Badge>
                      Clique em "Gerar QR Code"
                    </li>
                    <li className="flex gap-2">
                      <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 shrink-0">2</Badge>
                      Abra o WhatsApp no celular
                    </li>
                    <li className="flex gap-2">
                      <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 shrink-0">3</Badge>
                      Toque em "Dispositivos conectados" → "Conectar dispositivo"
                    </li>
                    <li className="flex gap-2">
                      <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 shrink-0">4</Badge>
                      Escaneie o QR Code exibido acima
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Send Message Tab */}
        <TabsContent value="send">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Alunos
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar aluno..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1 px-4 pb-4">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.user_id}
                          onClick={() => handleSelectStudent(student.user_id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedStudentId === student.user_id
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <p className="font-medium text-sm truncate">
                            {student.full_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {student.whatsapp ? (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {formatPhoneBR(student.whatsapp)}
                              </span>
                            ) : (
                              <span className="text-xs text-destructive">Sem WhatsApp</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {filteredStudents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhum aluno encontrado.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Message Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Mensagem
                  </CardTitle>
                  <CardDescription>
                    {connectionState === 'open'
                      ? 'Selecione um aluno ou digite o número para enviar.'
                      : 'Conecte seu dispositivo primeiro para enviar mensagens.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {connectionState !== 'open' && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                      <WifiOff className="h-5 w-5 text-destructive shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Dispositivo desconectado</p>
                        <p className="text-xs text-muted-foreground">
                          Vá na aba "Conectar Dispositivo" para escanear o QR Code.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="send-number">Número do WhatsApp</Label>
                    <Input
                      id="send-number"
                      placeholder="(99) 99999-9999"
                      value={sendNumber}
                      onChange={(e) => setSendNumber(formatPhoneBR(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="send-message">Mensagem</Label>
                    <Textarea
                      id="send-message"
                      placeholder="Digite sua mensagem..."
                      value={sendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                      rows={6}
                      maxLength={4096}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {sendMessage.length}/4096
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSendMessage}
                    disabled={
                      !sendNumber.trim() ||
                      !sendMessage.trim() ||
                      sendMutation.isPending ||
                      connectionState !== 'open'
                    }
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>

                  {sendMutation.isSuccess && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">Mensagem enviada com sucesso!</span>
                    </div>
                  )}

                  {sendMutation.isError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm">
                        {(sendMutation.error as any)?.message || 'Erro ao enviar mensagem'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
