import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Phone, ExternalLink, Users, AlertCircle, FileText } from 'lucide-react';
import { formatPhoneBR } from '@/lib/masks';

interface WhatsAppBulkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
}

interface EnrolledStudent {
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
    whatsapp: string | null;
  } | null;
}

const MESSAGE_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    template: 'Olá! 👋 Seja bem-vindo(a) ao curso "{courseTitle}"! Estamos muito felizes em ter você conosco. Qualquer dúvida, estamos à disposição!',
  },
  {
    id: 'reminder',
    name: 'Lembrete de Estudo',
    template: 'Olá! 📚 Não esqueça de continuar seus estudos no curso "{courseTitle}". Falta pouco para você concluir! Bons estudos!',
  },
  {
    id: 'new-content',
    name: 'Novo Conteúdo',
    template: 'Olá! 🎉 Temos novidades no curso "{courseTitle}"! Acesse a plataforma para conferir o novo conteúdo disponível.',
  },
  {
    id: 'exam-reminder',
    name: 'Lembrete de Prova',
    template: 'Olá! 📝 Lembre-se de realizar a prova final do curso "{courseTitle}" para obter seu certificado. Boa sorte!',
  },
  {
    id: 'certificate',
    name: 'Certificado Disponível',
    template: 'Parabéns! 🎓 Seu certificado do curso "{courseTitle}" está disponível! Acesse a plataforma para baixar.',
  },
  {
    id: 'support',
    name: 'Suporte',
    template: 'Olá! 💬 Notamos que você pode ter dúvidas sobre o curso "{courseTitle}". Estamos aqui para ajudar! Entre em contato conosco.',
  },
];

export function WhatsAppBulkModal({ open, onOpenChange, courseId, courseTitle }: WhatsAppBulkModalProps) {
  const [message, setMessage] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['course-students-whatsapp', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('user_id')
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
        profiles: profilesMap.get(enrollment.user_id) || null,
      })) as EnrolledStudent[];
    },
    enabled: open,
  });

  const studentsWithWhatsApp = students?.filter(s => s.profiles?.whatsapp) || [];
  const studentsWithoutWhatsApp = students?.filter(s => !s.profiles?.whatsapp) || [];

  const generateWhatsAppLink = (phone: string, text: string) => {
    const encodedMessage = encodeURIComponent(text);
    return `https://wa.me/55${phone}?text=${encodedMessage}`;
  };

  const openAllLinks = () => {
    if (!message.trim()) return;
    
    studentsWithWhatsApp.forEach((student, index) => {
      if (student.profiles?.whatsapp) {
        setTimeout(() => {
          window.open(generateWhatsAppLink(student.profiles!.whatsapp!, message), '_blank');
        }, index * 500); // Delay de 500ms entre cada abertura para evitar bloqueio do navegador
      }
    });
  };

  const applyTemplate = (template: string) => {
    setMessage(template.replace('{courseTitle}', courseTitle));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar Mensagem em Massa
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem via WhatsApp para todos os alunos do curso "{courseTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Templates */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </Label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template.template)}
                  className="text-xs"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite a mensagem ou selecione um template acima..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000 caracteres
            </p>
          </div>

          {/* Students List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
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

            <ScrollArea className="flex-1 border rounded-lg">
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
                          <p className="text-xs text-muted-foreground truncate">
                            {student.profiles?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground hidden sm:block">
                            {formatPhoneBR(student.profiles!.whatsapp!)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!message.trim()}
                            onClick={() => {
                              if (student.profiles?.whatsapp) {
                                window.open(
                                  generateWhatsAppLink(student.profiles.whatsapp, message),
                                  '_blank'
                                );
                              }
                            }}
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Enviar</span>
                          </Button>
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
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              className="flex-1"
              disabled={!message.trim() || studentsWithWhatsApp.length === 0}
              onClick={openAllLinks}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Todos ({studentsWithWhatsApp.length})
            </Button>
          </div>

          {studentsWithWhatsApp.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Os links serão abertos em novas abas. Certifique-se de permitir pop-ups neste site.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
