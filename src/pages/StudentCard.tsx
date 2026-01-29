import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Download,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Wallet,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StudentCardForm } from '@/components/studentCard/StudentCardForm';
import { StudentCardPreview } from '@/components/studentCard/StudentCardPreview';
import { StudentCardPdf, generateQRCodeDataUrl } from '@/components/studentCard/StudentCardPdf';
import { PaymentCheckout } from '@/components/payment/PaymentCheckout';
import { pdf } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import logoWhite from '@/assets/logo_formak_white.png';

type StudentCardType = {
  id: string;
  user_id: string;
  card_code: string;
  photo_url: string | null;
  plan_type: 'digital' | 'printed';
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled';
  shipping_address: Record<string, string> | null;
  shipping_status: 'pending' | 'processing' | 'shipped' | 'delivered' | null;
  issued_at: string | null;
  expires_at: string | null;
  paid_at: string | null;
  amount_paid: number | null;
  created_at: string;
  updated_at: string;
};

const statusConfig = {
  pending_payment: {
    label: 'Aguardando Pagamento',
    color: 'bg-amber-500/10 text-amber-500',
    icon: Clock,
  },
  active: {
    label: 'Ativa',
    color: 'bg-emerald-500/10 text-emerald-500',
    icon: CheckCircle,
  },
  expired: {
    label: 'Expirada',
    color: 'bg-red-500/10 text-red-500',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-gray-500/10 text-gray-500',
    icon: XCircle,
  },
};

const shippingStatusConfig = {
  pending: { label: 'Aguardando', color: 'bg-gray-500/10 text-gray-500' },
  processing: { label: 'Em Preparação', color: 'bg-blue-500/10 text-blue-500' },
  shipped: { label: 'Enviado', color: 'bg-amber-500/10 text-amber-500' },
  delivered: { label: 'Entregue', color: 'bg-emerald-500/10 text-emerald-500' },
};

export default function StudentCard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [downloading, setDownloading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch user profile
  const { data: profile } = useQuery({
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

  // Fetch existing student card
  const { data: studentCard, isLoading: cardLoading } = useQuery({
    queryKey: ['student-card', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase
        .from('student_cards') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as StudentCardType | null;
    },
    enabled: !!user,
  });

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['student-card', user?.id] });
  };

  const handleDownloadPdf = async () => {
    if (!studentCard || !profile) return;

    setDownloading(true);

    try {
      const validationUrl = `${window.location.origin}/validar-carteirinha?codigo=${studentCard.card_code}`;
      const qrCodeDataUrl = await generateQRCodeDataUrl(validationUrl);
      const expiresAt = studentCard.expires_at
        ? format(new Date(studentCard.expires_at), 'dd/MM/yyyy', { locale: ptBR })
        : '-';

      // Convert logo to data URL
      const logoResponse = await fetch(logoWhite);
      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      const blob = await pdf(
        <StudentCardPdf
          studentName={profile.full_name}
          photoUrl={studentCard.photo_url}
          cardCode={studentCard.card_code}
          expiresAt={expiresAt}
          validationUrl={validationUrl}
          qrCodeDataUrl={qrCodeDataUrl}
          logoUrl={logoDataUrl}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `carteirinha-${studentCard.card_code}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const validationUrl = studentCard
    ? `${window.location.origin}/validar-carteirinha?codigo=${studentCard.card_code}`
    : '';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const hasActiveCard = studentCard && (studentCard.status === 'active' || studentCard.status === 'pending_payment');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              to="/meu-progresso"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar ao Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold">
                  Carteirinha de Estudante
                </h1>
                <p className="text-muted-foreground">
                  Sua identificação digital como estudante
                </p>
              </div>
            </div>
          </motion.div>

          {cardLoading ? (
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="h-[400px]" />
              <Skeleton className="h-[600px]" />
            </div>
          ) : hasActiveCard && studentCard ? (
            /* Show existing card */
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Card Preview */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Sua Carteirinha</CardTitle>
                      <Badge className={statusConfig[studentCard.status].color}>
                        {statusConfig[studentCard.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs value={previewSide} onValueChange={(v) => setPreviewSide(v as 'front' | 'back')}>
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="front">Frente</TabsTrigger>
                        <TabsTrigger value="back">Verso</TabsTrigger>
                      </TabsList>
                      <TabsContent value="front">
                        <StudentCardPreview
                          studentName={profile?.full_name || ''}
                          photoUrl={studentCard.photo_url}
                          cardCode={studentCard.card_code}
                          expiresAt={studentCard.expires_at ? new Date(studentCard.expires_at) : undefined}
                          validationUrl={validationUrl}
                          side="front"
                        />
                      </TabsContent>
                      <TabsContent value="back">
                        <StudentCardPreview
                          studentName={profile?.full_name || ''}
                          photoUrl={studentCard.photo_url}
                          cardCode={studentCard.card_code}
                          expiresAt={studentCard.expires_at ? new Date(studentCard.expires_at) : undefined}
                          validationUrl={validationUrl}
                          side="back"
                        />
                      </TabsContent>
                    </Tabs>

                    {studentCard.status === 'active' && (
                      <Button
                        onClick={handleDownloadPdf}
                        disabled={downloading}
                        className="w-full"
                        variant="hero"
                      >
                        {downloading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Gerando PDF...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Card Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Código</p>
                        <p className="font-mono font-medium">{studentCard.card_code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Plano</p>
                        <p className="font-medium capitalize">{studentCard.plan_type === 'digital' ? 'Digital' : 'Impresso'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor</p>
                        <p className="font-medium">R$ {studentCard.amount_paid?.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Solicitado em</p>
                        <p className="font-medium">
                          {format(new Date(studentCard.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      {studentCard.expires_at && (
                        <div>
                          <p className="text-sm text-muted-foreground">Válida até</p>
                          <p className="font-medium">
                            {format(new Date(studentCard.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>

                    {studentCard.plan_type === 'printed' && studentCard.shipping_status && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Status do Envio</p>
                        <Badge className={shippingStatusConfig[studentCard.shipping_status].color}>
                          {shippingStatusConfig[studentCard.shipping_status].label}
                        </Badge>
                      </div>
                    )}

                    {studentCard.status === 'pending_payment' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <p className="text-sm text-foreground mb-3">
                            <Clock className="h-4 w-4 inline mr-2" />
                            Sua carteirinha está aguardando pagamento.
                          </p>
                          <Button 
                            onClick={() => setShowPaymentDialog(true)}
                            className="w-full"
                          >
                            <Wallet className="h-4 w-4 mr-2" />
                            Pagar Agora
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Validação Online
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Qualquer pessoa pode validar sua carteirinha acessando:
                    </p>
                    <div className="p-3 bg-muted rounded-lg">
                      <code className="text-xs break-all">{validationUrl}</code>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : (
            /* Show form to request new card */
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <StudentCardForm
                  userId={user?.id || ''}
                  studentName={profile?.full_name || ''}
                  photoUrl={photoUrl}
                  onPhotoChange={setPhotoUrl}
                  onSuccess={handleFormSuccess}
                />
              </motion.div>

              {/* Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:sticky lg:top-8 space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preview da Carteirinha</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="front">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="front">Frente</TabsTrigger>
                        <TabsTrigger value="back">Verso</TabsTrigger>
                      </TabsList>
                      <TabsContent value="front">
                        <StudentCardPreview
                          studentName={profile?.full_name || ''}
                          photoUrl={photoUrl}
                          cardCode="CARD-XXXXXX"
                          validationUrl={`${window.location.origin}/validar-carteirinha`}
                          side="front"
                        />
                      </TabsContent>
                      <TabsContent value="back">
                        <StudentCardPreview
                          studentName={profile?.full_name || ''}
                          photoUrl={photoUrl}
                          cardCode="CARD-XXXXXX"
                          validationUrl={`${window.location.origin}/validar-carteirinha`}
                          side="back"
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Benefícios da Carteirinha</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Identificação oficial como estudante</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Validade de 1 ano</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>QR Code para validação rápida</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>Disponível em formato digital e impresso</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pagamento da Carteirinha</DialogTitle>
            </DialogHeader>
            {studentCard && (
              <PaymentCheckout
                referenceType="student_card"
                referenceId={studentCard.id}
                amount={studentCard.amount_paid || (studentCard.plan_type === 'digital' ? 29.90 : 49.90)}
                description={`Carteirinha de Estudante - ${studentCard.plan_type === 'digital' ? 'Digital' : 'Impressa'}`}
                onSuccess={() => {
                  setShowPaymentDialog(false);
                  queryClient.invalidateQueries({ queryKey: ['student-card', user?.id] });
                }}
                onCancel={() => setShowPaymentDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
