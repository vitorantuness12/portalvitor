import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  Settings,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { formatPhoneBR } from '@/lib/masks';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ConnectionState = 'open' | 'close' | 'connecting' | 'unknown';

interface EvolutionConfig {
  url: string;
  apiKey: string;
  instance: string;
}

interface Student {
  user_id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
}

const DYNAMIC_VARIABLES = [
  { key: '{nome}', description: 'Nome do aluno' },
  { key: '{curso}', description: 'Nome do curso' },
  { key: '{progresso}', description: 'Progresso do aluno (%)' },
  { key: '{data}', description: 'Data de hoje' },
];

const MESSAGE_TEMPLATES = [
  { id: 'welcome', name: 'Boas-vindas', template: 'Olá, {nome}! 👋 Bem-vindo(a) ao curso {curso}. Estamos felizes em ter você conosco!' },
  { id: 'reminder', name: 'Lembrete', template: 'Olá, {nome}! 📚 Você está com {progresso} no curso {curso}. Continue seus estudos!' },
  { id: 'certificate', name: 'Certificado', template: 'Parabéns, {nome}! 🎓 Seu certificado do curso {curso} está disponível!' },
  { id: 'support', name: 'Suporte', template: 'Olá, {nome}! 💬 Precisa de ajuda com o curso {curso}? Estamos aqui para você.' },
];

export default function WhatsAppAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>('unknown');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState<EvolutionConfig>(() => {
    const saved = localStorage.getItem('evolution_config');
    return saved ? JSON.parse(saved) : { url: '', apiKey: '', instance: '' };
  });
  const [tempConfig, setTempConfig] = useState(config);
  
  // Message sending state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [sendingStatus, setSendingStatus] = useState<Record<string, 'pending' | 'sending' | 'sent' | 'error'>>({});
  const [isSending, setIsSending] = useState(false);

  // Save config to localStorage
  const saveConfig = useCallback(() => {
    localStorage.setItem('evolution_config', JSON.stringify(tempConfig));
    setConfig(tempConfig);
    setShowConfig(false);
    toast({ title: 'Configurações salvas com sucesso!' });
  }, [tempConfig, toast]);

  // Invoke Evolution API
  const invokeEvolution = useCallback(async (action: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('evolution-api', {
      body: { action, ...params },
    });
    if (error) throw new Error(error.message || 'Erro na requisição');
    if (!data?.success) throw new Error(data?.error || 'Erro desconhecido');
    return data;
  }, []);

  // Fetch connection status
  const { data: statusData, refetch: refetchStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['evolution-status'],
    queryFn: async () => {
      if (!config.url || !config.apiKey || !config.instance) {
        throw new Error('Configure a Evolution API primeiro');
      }
      return invokeEvolution('status');
    },
    refetchInterval: 30000,
    enabled: !!config.url && !!config.apiKey && !!config.instance,
  });

  useEffect(() => {
    if (statusData?.success && statusData?.data) {
      const state = statusData.data.instance?.state || statusData.data.state || 'unknown';
      setConnectionState(state);
      if (state === 'open') setQrCode(null);
    }
  }, [statusData]);

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ['admin-students-whatsapp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, whatsapp')
        .not('whatsapp', 'is', null)
        .order('full_name');
      if (error) throw error;
      return data as Student[];
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

  // Actions
  const handleGenerateQR = async () => {
    setQrLoading(true);
    try {
      const data = await invokeEvolution('qrcode');
      if (data?.data) {
        const base64 = data.data.base64 || data.data.qrcode?.base64 || null;
        if (base64) {
          setQrCode(base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`);
        } else {
          toast({ title: 'Instância já conectada ou aguardando...' });
          refetchStatus();
        }
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar QR Code', description: err.message, variant: 'destructive' });
    } finally {
      setQrLoading(false);
    }
  };

  const handleRestart = async () => {
    try {
      await invokeEvolution('restart');
      toast({ title: 'Instância reiniciada' });
      setTimeout(() => refetchStatus(), 3000);
    } catch (err: any) {
      toast({ title: 'Erro ao reiniciar', description: err.message, variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    try {
      await invokeEvolution('logout');
      setConnectionState('close');
      setQrCode(null);
      toast({ title: 'Dispositivo desconectado' });
    } catch (err: any) {
      toast({ title: 'Erro ao desconectar', description: err.message, variant: 'destructive' });
    }
  };

  // Send message
  const sendToStudent = async (student: Student) => {
    if (!student.whatsapp || !message.trim()) return;
    
    const personalizedMessage = message
      .replace(/{nome}/g, student.full_name || 'Aluno')
      .replace(/{curso}/g, 'Formak')
      .replace(/{progresso}/g, '100%')
      .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'));

    setSendingStatus(prev => ({ ...prev, [student.user_id]: 'sending' }));
    
    try {
      await invokeEvolution('send-text', {
        number: student.whatsapp.replace(/\D/g, ''),
        message: personalizedMessage,
      });
      setSendingStatus(prev => ({ ...prev, [student.user_id]: 'sent' }));
    } catch (err: any) {
      setSendingStatus(prev => ({ ...prev, [student.user_id]: 'error' }));
      toast({ title: `Erro para ${student.full_name}`, description: err.message, variant: 'destructive' });
    }
  };

  const handleSendToAll = async () => {
    if (selectedStudents.length === 0 || !message.trim()) return;
    
    setIsSending(true);
    const selectedStudentObjects = students?.filter(s => selectedStudents.includes(s.user_id)) || [];
    
    for (const student of selectedStudentObjects) {
      await sendToStudent(student);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsSending(false);
    const sent = Object.values(sendingStatus).filter(s => s === 'sent').length;
    const errors = Object.values(sendingStatus).filter(s => s === 'error').length;
    toast({
      title: 'Envio concluído',
      description: `${sent} enviadas, ${errors} com erro`,
      variant: errors > 0 ? 'destructive' : 'default',
    });
  };

  const toggleStudent = (userId: string) => {
    setSelectedStudents(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.user_id));
    }
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'open': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'close': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (connectionState) {
      case 'open': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'close': return 'Desconectado';
      default: return 'Não configurado';
    }
  };

  const previewMessage = message
    .replace(/{nome}/g, previewStudent?.full_name || 'Nome do Aluno')
    .replace(/{curso}/g, 'Formak')
    .replace(/{progresso}/g, '85%')
    .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'));

  const isConfigured = !!(config.url && config.apiKey && config.instance);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="h-7 w-7 text-primary" />
            WhatsApp Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a conexão e envie mensagens via Evolution API
          </p>
        </div>
        <Button
          variant={isConfigured ? "outline" : "default"}
          onClick={() => setShowConfig(!showConfig)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          {isConfigured ? 'Editar Config' : 'Configurar API'}
        </Button>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações da Evolution API
                </CardTitle>
                <CardDescription>
                  Informe os dados de conexão com sua instância da Evolution API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiUrl">URL da API</Label>
                    <Input
                      id="apiUrl"
                      placeholder="https://evolution-api.exemplo.com.br"
                      value={tempConfig.url}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, url: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">URL base da sua Evolution API</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave da API</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sua-api-key-aqui"
                      value={tempConfig.apiKey}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">API Key da sua instância</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instance">Nome da Instância</Label>
                    <Input
                      id="instance"
                      placeholder="minha-instancia"
                      value={tempConfig.instance}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, instance: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Nome da instância criada</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    As configurações são salvas localmente no seu navegador. Certifique-se de que a Evolution API está rodando e acessível.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => { setTempConfig(config); setShowConfig(false); }}>
                    Cancelar
                  </Button>
                  <Button onClick={saveConfig}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-4 w-4 rounded-full",
                  getStatusColor(),
                  connectionState === 'connecting' && "animate-pulse"
                )} />
                <div>
                  <CardTitle className="text-lg">Status da Conexão</CardTitle>
                  <CardDescription>{getStatusLabel()}</CardDescription>
                </div>
                {!isConfigured && (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Não configurado
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchStatus()} disabled={!isConfigured || statusLoading}>
                  <RefreshCw className={cn("h-4 w-4", statusLoading && "animate-spin")} />
                </Button>
                {connectionState === 'open' ? (
                  <Button variant="destructive" size="sm" onClick={handleLogout}>
                    <PowerOff className="h-4 w-4 mr-1" />
                    Desconectar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleRestart} disabled={!isConfigured}>
                    <Power className="h-4 w-4 mr-1" />
                    Reiniciar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Main Tabs */}
      <Tabs defaultValue={!isConfigured ? 'connect' : 'send'} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connect" className="gap-2">
            <QrCode className="h-4 w-4" />
            Conectar
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Enviar Mensagens
          </TabsTrigger>
        </TabsList>

        {/* Connect Tab */}
        <TabsContent value="connect">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Conectar Dispositivo
              </CardTitle>
              <CardDescription>
                Escaneie o QR Code com o WhatsApp do seu celular para conectar
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              {!isConfigured ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <Settings className="h-16 w-16 text-muted-foreground/30" />
                  <div>
                    <p className="font-medium">Evolution API não configurada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure a API acima para gerar o QR Code
                    </p>
                  </div>
                  <Button onClick={() => setShowConfig(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar API
                  </Button>
                </div>
              ) : connectionState === 'open' ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Wifi className="h-10 w-10 text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600">Dispositivo Conectado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      O WhatsApp está conectado e pronto para enviar mensagens
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleRestart}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconectar
                  </Button>
                </div>
              ) : (
                <>
                  {qrCode ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-primary/10">
                        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        Abra o WhatsApp no seu celular, toque em Menu ou Configurações e selecione "Aparelhos conectados". 
                        Toque em "Conectar um aparelho" e escaneie o QR Code.
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                      <div>
                        <p className="font-medium">Nenhum QR Code gerado</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Clique no botão abaixo para gerar um novo QR Code
                        </p>
                      </div>
                    </div>
                  )}
                  <Button onClick={handleGenerateQR} disabled={qrLoading} size="lg" className="gap-2">
                    {qrLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <QrCode className="h-5 w-5" />
                    )}
                    {qrCode ? 'Gerar Novo QR Code' : 'Gerar QR Code'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Messages Tab */}
        <TabsContent value="send">
          {!isConfigured ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <Settings className="h-16 w-16 text-muted-foreground/30" />
                <div className="text-center">
                  <p className="font-medium">Configure a Evolution API primeiro</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vá até a aba "Conectar" e configure sua API
                  </p>
                </div>
                <Button onClick={() => setShowConfig(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar API
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Student Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Selecionar Alunos
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      {selectedStudents.length === filteredStudents.length ? 'Desmarcar todos' : 'Selecionar todos'}
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedStudents.length} de {filteredStudents.length} alunos selecionados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou WhatsApp..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Student List */}
                  <ScrollArea className="h-[400px] -mx-4 px-4">
                    <div className="space-y-2">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.user_id}
                          onClick={() => toggleStudent(student.user_id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            selectedStudents.includes(student.user_id)
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted/50 border-transparent"
                          )}
                        >
                          <div className={cn(
                            "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                            selectedStudents.includes(student.user_id)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          )}>
                            {selectedStudents.includes(student.user_id) && (
                              <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.whatsapp ? formatPhoneBR(student.whatsapp) : 'Sem WhatsApp'}
                            </p>
                          </div>
                          {sendingStatus[student.user_id] === 'sent' && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                          {sendingStatus[student.user_id] === 'error' && (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          {sendingStatus[student.user_id] === 'sending' && (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      ))}
                      {filteredStudents.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p>Nenhum aluno encontrado</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Right Column - Message Composer */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Compor Mensagem
                  </CardTitle>
                  <CardDescription>
                    Use variáveis como {'{nome}'}, {'{curso}'}, {'{progresso}'} e {'{data}'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Templates */}
                  <div className="space-y-2">
                    <Label className="text-sm">Templates Rápidos</Label>
                    <div className="flex flex-wrap gap-2">
                      {MESSAGE_TEMPLATES.map((template) => (
                        <Button
                          key={template.id}
                          variant="outline"
                          size="sm"
                          onClick={() => setMessage(template.template)}
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Variables */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Variáveis:</span>
                    {DYNAMIC_VARIABLES.map((v) => (
                      <Badge
                        key={v.key}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10"
                        onClick={() => setMessage(prev => prev + v.key)}
                      >
                        {v.key}
                      </Badge>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Digite sua mensagem aqui..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/1000 caracteres
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Preview</Label>
                      <Select onValueChange={(id) => setPreviewStudent(students?.find(s => s.user_id === id) || null)}>
                        <SelectTrigger className="w-[200px] h-8 text-xs">
                          <SelectValue placeholder="Selecione aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          {students?.map((s) => (
                            <SelectItem key={s.user_id} value={s.user_id} className="text-xs">
                              {s.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg border text-sm whitespace-pre-wrap">
                      {previewMessage || 'Selecione um aluno para ver o preview'}
                    </div>
                  </div>

                  <Separator />

                  {/* Send Button */}
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    disabled={selectedStudents.length === 0 || !message.trim() || isSending}
                    onClick={handleSendToAll}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Enviar para {selectedStudents.length} aluno{selectedStudents.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>

                  {connectionState !== 'open' && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-lg text-sm text-yellow-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>WhatsApp desconectado. Conecte primeiro na aba "Conectar".</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
