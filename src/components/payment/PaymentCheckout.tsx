import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCpf } from '@/lib/masks';

interface PaymentCheckoutProps {
  referenceType: 'student_card' | 'course';
  referenceId: string;
  amount: number;
  description: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

type PaymentStatus = 'idle' | 'processing' | 'awaiting_pix' | 'approved' | 'rejected';

export function PaymentCheckout({
  referenceType,
  referenceId,
  amount,
  description,
  onSuccess,
  onCancel,
}: PaymentCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    expiration: string;
    paymentId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
  });
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Poll for PIX payment status
  useEffect(() => {
    if (status !== 'awaiting_pix' || !pixData?.paymentId) return;

    const interval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await supabase.functions.invoke('check-payment-status', {
          body: { paymentId: pixData.paymentId },
        });

        if (response.data?.status === 'approved') {
          setStatus('approved');
          clearInterval(interval);
          toast.success('Pagamento confirmado!');
          setTimeout(() => onSuccess(), 2000);
        } else if (response.data?.status === 'rejected') {
          setStatus('rejected');
          clearInterval(interval);
          toast.error('Pagamento rejeitado');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [status, pixData?.paymentId, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (paymentMethod === 'pix' && !formData.cpf) {
      toast.error('CPF é obrigatório para pagamento via Pix');
      return;
    }

    setStatus('processing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para fazer um pagamento');
        setStatus('idle');
        return;
      }

      const response = await supabase.functions.invoke('create-payment', {
        body: {
          referenceType,
          referenceId,
          amount,
          paymentMethod,
          description,
          payerEmail: formData.email,
          payerName: formData.name,
          payerCpf: formData.cpf.replace(/\D/g, ''),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao criar pagamento');
      }

      const data = response.data;

      if (data.status === 'approved') {
        setStatus('approved');
        toast.success('Pagamento aprovado!');
        setTimeout(() => onSuccess(), 2000);
      } else if (paymentMethod === 'pix' && data.pixQrCode) {
        setPixData({
          qrCode: data.pixQrCode,
          qrCodeBase64: data.pixQrCodeBase64,
          expiration: data.pixExpiration,
          paymentId: data.paymentId,
        });
        setStatus('awaiting_pix');
        toast.success('QR Code Pix gerado! Escaneie para pagar.');
      } else if (data.status === 'rejected') {
        setStatus('rejected');
        toast.error('Pagamento rejeitado. Tente outro método.');
      } else {
        setStatus('idle');
        toast.info('Aguardando confirmação do pagamento');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      setStatus('idle');
    }
  };

  const handleCopyPixCode = async () => {
    if (!pixData?.qrCode) return;
    
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast.success('Código Pix copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  const handleCheckStatus = async () => {
    if (!pixData?.paymentId) return;
    
    setCheckingStatus(true);
    try {
      const response = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId: pixData.paymentId },
      });

      if (response.data?.status === 'approved') {
        setStatus('approved');
        toast.success('Pagamento confirmado!');
        setTimeout(() => onSuccess(), 2000);
      } else if (response.data?.status === 'rejected') {
        setStatus('rejected');
        toast.error('Pagamento rejeitado');
      } else {
        toast.info('Pagamento ainda pendente. Aguardando confirmação...');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Render based on status
  if (status === 'approved') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-full mb-4">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Pagamento Aprovado!</h3>
        <p className="text-muted-foreground">Seu pagamento foi confirmado com sucesso.</p>
      </motion.div>
    );
  }

  if (status === 'rejected') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Pagamento Rejeitado</h3>
        <p className="text-muted-foreground mb-4">
          Houve um problema com o pagamento. Por favor, tente novamente.
        </p>
        <Button onClick={() => setStatus('idle')}>Tentar Novamente</Button>
      </motion.div>
    );
  }

  if (status === 'awaiting_pix' && pixData) {
    const expirationDate = pixData.expiration ? new Date(pixData.expiration) : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Pague com Pix</h3>
          <p className="text-sm text-muted-foreground">
            Escaneie o QR Code ou copie o código para pagar
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-xl shadow-lg">
            {pixData.qrCodeBase64 ? (
              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code Pix"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-muted">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Copy Code */}
        <div className="space-y-2">
          <Label>Código Pix (Copia e Cola)</Label>
          <div className="flex gap-2">
            <Input
              value={pixData.qrCode}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPixCode}
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expiration */}
        {expirationDate && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expira em: {expirationDate.toLocaleString('pt-BR')}</span>
          </div>
        )}

        {/* Status */}
        <div className="p-4 bg-primary/5 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="font-medium">Aguardando pagamento...</span>
          </div>
          <p className="text-xs text-muted-foreground">
            O status será atualizado automaticamente após o pagamento
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleCheckStatus}
          disabled={checkingStatus}
        >
          {checkingStatus ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Status
            </>
          )}
        </Button>

        {onCancel && (
          <Button variant="ghost" className="w-full" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total a pagar</span>
            <span className="text-2xl font-bold text-primary">
              R$ {amount.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'pix' | 'credit_card')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pix" className="gap-2">
                <QrCode className="h-4 w-4" />
                Pix
              </TabsTrigger>
              <TabsTrigger value="credit_card" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Cartão
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pix" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Pagamento instantâneo via Pix. Escaneie o QR Code ou copie o código para pagar.
              </p>
            </TabsContent>
            <TabsContent value="credit_card" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Pagamento com cartão de crédito ou débito.
              </p>
              <p className="text-xs text-destructive mt-2">
                ⚠️ Cartão de crédito requer integração do SDK do Mercado Pago no frontend.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Pagador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome completo *</Label>
            <Input
              id="name"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="cpf">CPF {paymentMethod === 'pix' && '*'}</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
              maxLength={14}
              required={paymentMethod === 'pix'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1"
          disabled={status === 'processing'}
        >
          {status === 'processing' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              {paymentMethod === 'pix' ? (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code Pix
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pagar com Cartão
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
