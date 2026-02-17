import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSquare, Phone, Send, Users, AlertCircle, FileText, Plus, Trash2, Save, Info, Eye, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPhoneBR } from '@/lib/masks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppBulkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

interface EnrolledStudent {
  user_id: string;
  progress: number;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    whatsapp: string | null;
  } | null;
}

const DYNAMIC_VARIABLES = [
  { key: '{nomeAluno}', description: 'Nome do aluno' },
  { key: '{courseTitle}', description: 'Nome do curso' },
  { key: '{progresso}', description: 'Progresso do aluno (%)' },
  { key: '{dataMatricula}', description: 'Data de matrícula' },
  { key: '{dataHoje}', description: 'Data de hoje' },
];

const DEFAULT_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    template: 'Olá! 👋 Seja bem-vindo(a) ao curso "{courseTitle}"! Estamos muito felizes em ter você conosco. Qualquer dúvida, estamos à disposição!',
    isDefault: true,
  },
  {
    id: 'reminder',
    name: 'Lembrete de Estudo',
    template: 'Olá! 📚 Não esqueça de continuar seus estudos no curso "{courseTitle}". Falta pouco para você concluir! Bons estudos!',
    isDefault: true,
  },
  {
    id: 'new-content',
    name: 'Novo Conteúdo',
    template: 'Olá! 🎉 Temos novidades no curso "{courseTitle}"! Acesse a plataforma para conferir o novo conteúdo disponível.',
    isDefault: true,
  },
  {
    id: 'exam-reminder',
    name: 'Lembrete de Prova',
    template: 'Olá! 📝 Lembre-se de realizar a prova final do curso "{courseTitle}" para obter seu certificado. Boa sorte!',
    isDefault: true,
  },
  {
    id: 'certificate',
    name: 'Certificado Disponível',
    template: 'Parabéns! 🎓 Seu certificado do curso "{courseTitle}" está disponível! Acesse a plataforma para baixar.',
    isDefault: true,
  },
  {
    id: 'support',
    name: 'Suporte',
    template: 'Olá! 💬 Notamos que você pode ter dúvidas sobre o curso "{courseTitle}". Estamos aqui para ajudar! Entre em contato conosco.',
    isDefault: true,
  },
];

export function WhatsAppBulkModal({ open, onOpenChange, courseId, courseTitle }: WhatsAppBulkModalProps) {
  const [message, setMessage] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [sendingStatus, setSendingStatus] = useState<Record<string, 'pending' | 'sending' | 'sent' | 'error'>>({});
  const [isBulkSending, setIsBulkSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch custom templates
  const { data: customTemplates } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch students with enrollment data
  const { data: students, isLoading } = useQuery({
    queryKey: ['course-students-whatsapp', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('user_id, progress, created_at')
        .eq('course_id', courseId);

      if (error) throw error;

      if (!data || data.length === 0) return [];

      const userIds = data.map(e => e.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, whatsapp')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(enrollment => ({
        user_id: enrollment.user_id,
        progress: enrollment.progress,
        created_at: enrollment.created_at,
        profiles: profilesMap.get(enrollment.user_id) || null,
      })) as EnrolledStudent[];
    },
    enabled: open,
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async ({ name, template }: { name: string; template: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('whatsapp_templates')
        .insert({ name, template, created_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      setShowNewTemplate(false);
      setNewTemplateName('');
      setNewTemplateContent('');
      toast({ title: 'Template salvo com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar template', variant: 'destructive' });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast({ title: 'Template excluído!' });
    },
    onError: () => {
      toast({ title: 'Erro ao excluir template', variant: 'destructive' });
    },
  });

  const studentsWithWhatsApp = students?.filter(s => s.profiles?.whatsapp) || [];
  const studentsWithoutWhatsApp = students?.filter(s => !s.profiles?.whatsapp) || [];

  const replaceVariables = (text: string, student: EnrolledStudent) => {
    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    const enrollmentDate = student.created_at 
      ? format(new Date(student.created_at), "dd/MM/yyyy", { locale: ptBR })
      : 'N/A';

    return text
      .replace(/{nomeAluno}/g, student.profiles?.full_name || 'Aluno')
      .replace(/{courseTitle}/g, courseTitle)
      .replace(/{progresso}/g, `${student.progress}%`)
      .replace(/{dataMatricula}/g, enrollmentDate)
      .replace(/{dataHoje}/g, today);
  };

  const sendToStudent = useCallback(async (student: EnrolledStudent) => {
    if (!student.profiles?.whatsapp || !message.trim()) return;
    
    const personalizedMessage = replaceVariables(message, student);
    const phone = student.profiles.whatsapp;
    
    setSendingStatus(prev => ({ ...prev, [student.user_id]: 'sending' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { number: phone, message: personalizedMessage },
      });
      
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao enviar');
      
      setSendingStatus(prev => ({ ...prev, [student.user_id]: 'sent' }));
    } catch (err) {
      console.error('Erro ao enviar para', phone, err);
      setSendingStatus(prev => ({ ...prev, [student.user_id]: 'error' }));
    }
  }, [message, courseTitle]);

  const sendToAll = async () => {
    if (!message.trim() || studentsWithWhatsApp.length === 0) return;
    
    setIsBulkSending(true);
    
    // Initialize all statuses
    const initialStatus: Record<string, 'pending' | 'sending' | 'sent' | 'error'> = {};
    studentsWithWhatsApp.forEach(s => { initialStatus[s.user_id] = 'pending'; });
    setSendingStatus(initialStatus);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const student of studentsWithWhatsApp) {
      await sendToStudent(student);
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSendingStatus(prev => {
        if (prev[student.user_id] === 'sent') successCount++;
        else if (prev[student.user_id] === 'error') errorCount++;
        return prev;
      });
    }
    
    // Count final results
    setSendingStatus(prev => {
      const sent = Object.values(prev).filter(s => s === 'sent').length;
      const errors = Object.values(prev).filter(s => s === 'error').length;
      
      toast({
        title: `Envio concluído`,
        description: `${sent} enviadas com sucesso${errors > 0 ? `, ${errors} com erro` : ''}`,
        variant: errors > 0 ? 'destructive' : 'default',
      });
      
      return prev;
    });
    
    setIsBulkSending(false);
  };

  const applyTemplate = (template: string) => {
    setMessage(template);
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) {
      toast({ title: 'Preencha o nome e o conteúdo do template', variant: 'destructive' });
      return;
    }
    createTemplateMutation.mutate({ name: newTemplateName.trim(), template: newTemplateContent.trim() });
  };

  const allTemplates = [
    ...DEFAULT_TEMPLATES,
    ...(customTemplates?.map(t => ({ ...t, isDefault: false })) || []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem em Massa
          </DialogTitle>
          <DialogDescription className="text-sm">
            Envie uma mensagem via WhatsApp para todos os alunos do curso "{courseTitle}"
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4 sm:px-6">
          <div className="space-y-4 pb-4">
          {/* Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewTemplate(!showNewTemplate)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Novo Template
              </Button>
            </div>

            {/* New Template Form */}
            {showNewTemplate && (
              <div className="p-3 border rounded-lg space-y-3 bg-muted/30">
                <Input
                  placeholder="Nome do template"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  maxLength={50}
                />
                <Textarea
                  placeholder="Conteúdo da mensagem... Use {courseTitle} para inserir o nome do curso"
                  value={newTemplateContent}
                  onChange={(e) => setNewTemplateContent(e.target.value)}
                  rows={3}
                  maxLength={1000}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNewTemplate(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveTemplate}
                    disabled={createTemplateMutation.isPending}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {allTemplates.map((template) => (
                <div key={template.id} className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template.template)}
                    className="text-xs"
                  >
                    {template.name}
                    {!template.isDefault && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                        Personalizado
                      </Badge>
                    )}
                  </Button>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Variables Info */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Variáveis disponíveis:
            </span>
            <TooltipProvider>
              {DYNAMIC_VARIABLES.map((variable) => (
                <Tooltip key={variable.key}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-primary/10"
                      onClick={() => setMessage(prev => prev + variable.key)}
                    >
                      {variable.key}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{variable.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite a mensagem ou selecione um template acima. Clique nas variáveis para adicioná-las."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000 caracteres
            </p>
          </div>

          {/* Message Preview */}
          {message.trim() && studentsWithWhatsApp.length > 0 && (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  Preview da Mensagem
                </Label>
                <Select
                  value={previewStudentId || studentsWithWhatsApp[0]?.user_id || ''}
                  onValueChange={setPreviewStudentId}
                >
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsWithWhatsApp.map((student) => (
                      <SelectItem key={student.user_id} value={student.user_id} className="text-xs">
                        {student.profiles?.full_name || 'Aluno'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-background rounded-lg border text-sm whitespace-pre-wrap">
                {(() => {
                  const selectedStudent = studentsWithWhatsApp.find(
                    s => s.user_id === (previewStudentId || studentsWithWhatsApp[0]?.user_id)
                  );
                  if (selectedStudent) {
                    return replaceVariables(message, selectedStudent);
                  }
                  return message;
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Visualização de como a mensagem ficará para{' '}
                <span className="font-medium">
                  {studentsWithWhatsApp.find(
                    s => s.user_id === (previewStudentId || studentsWithWhatsApp[0]?.user_id)
                  )?.profiles?.full_name || 'o aluno selecionado'}
                </span>
              </p>
            </div>
          )}

          {/* Students List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Alunos Matriculados
              </Label>
              {!isLoading && (
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {studentsWithWhatsApp.length} com WhatsApp
                  </Badge>
                  {studentsWithoutWhatsApp.length > 0 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {studentsWithoutWhatsApp.length} sem WhatsApp
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="border rounded-lg max-h-[200px] overflow-y-auto">
              <div className="p-3 space-y-2">
                {isLoading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : students?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Nenhum aluno matriculado neste curso</p>
                  </div>
                ) : (
                  <>
                    {studentsWithWhatsApp.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {student.profiles?.full_name || 'Usuário'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate">{student.profiles?.email}</span>
                            <Badge variant="outline" className="text-[10px] px-1">
                              {student.progress}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground hidden sm:block">
                            {formatPhoneBR(student.profiles!.whatsapp!)}
                          </span>
                          {sendingStatus[student.user_id] === 'sending' ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : sendingStatus[student.user_id] === 'sent' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : sendingStatus[student.user_id] === 'error' ? (
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-destructive" />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                onClick={() => sendToStudent(student)}
                              >
                                Reenviar
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!message.trim() || isBulkSending}
                              onClick={() => sendToStudent(student)}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Enviar</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {studentsWithoutWhatsApp.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-4 pb-2">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Alunos sem WhatsApp cadastrado
                          </span>
                        </div>
                        {studentsWithoutWhatsApp.map((student) => (
                          <div
                            key={student.user_id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg opacity-60"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {student.profiles?.full_name || 'Usuário'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.profiles?.email}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Sem WhatsApp
                            </Badge>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          </div>
        </ScrollArea>

        {/* Actions - Fixed at bottom */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              className="flex-1"
              disabled={!message.trim() || studentsWithWhatsApp.length === 0 || isBulkSending}
              onClick={sendToAll}
            >
              {isBulkSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para Todos ({studentsWithWhatsApp.length})
                </>
              )}
            </Button>
          </div>

          {isBulkSending && (
            <p className="text-xs text-muted-foreground text-center">
              Enviando mensagens via Evolution API... Não feche esta janela.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
