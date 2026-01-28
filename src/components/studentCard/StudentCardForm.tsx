import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Printer, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoUpload } from './PhotoUpload';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface StudentCardFormProps {
  userId: string;
  studentName: string;
  onPhotoChange: (url: string | null) => void;
  photoUrl: string | null;
  onSuccess: () => void;
}

interface ShippingAddress {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export function StudentCardForm({
  userId,
  studentName,
  onPhotoChange,
  photoUrl,
  onSuccess,
}: StudentCardFormProps) {
  const [planType, setPlanType] = useState<'digital' | 'printed'>('digital');
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const generateCardCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CARD-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl) {
      toast.error('Por favor, envie uma foto para a carteirinha');
      return;
    }

    if (planType === 'printed') {
      if (!address.street || !address.number || !address.city || !address.state || !address.zipCode) {
        toast.error('Por favor, preencha o endereço completo para envio');
        return;
      }
    }

    setSubmitting(true);

    try {
      const cardCode = generateCardCode();
      const amount = planType === 'digital' ? 29.90 : 49.90;

      // Use raw insert since types may not be updated yet
      const { error } = await supabase.from('student_cards').insert({
        user_id: userId,
        card_code: cardCode,
        photo_url: photoUrl,
        plan_type: planType,
        status: 'pending_payment',
        amount_paid: amount,
        shipping_address: planType === 'printed' ? address : null,
        shipping_status: planType === 'printed' ? 'pending' : null,
      } as any);

      if (error) throw error;

      toast.success('Solicitação de carteirinha enviada com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Error creating student card:', error);
      toast.error('Erro ao solicitar carteirinha. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foto para Carteirinha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-[200px] mx-auto">
            <PhotoUpload
              photoUrl={photoUrl}
              onPhotoChange={onPhotoChange}
              userId={userId}
              disabled={submitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escolha seu Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={planType}
            onValueChange={(value) => setPlanType(value as 'digital' | 'printed')}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <RadioGroupItem
                value="digital"
                id="digital"
                className="peer sr-only"
              />
              <Label
                htmlFor="digital"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <CreditCard className="h-8 w-8 mb-3 text-primary" />
                <span className="font-semibold">Digital</span>
                <span className="text-2xl font-bold text-primary mt-1">R$ 29,90</span>
                <span className="text-xs text-muted-foreground mt-2 text-center">
                  Acesso imediato após pagamento
                </span>
              </Label>
            </div>

            <div>
              <RadioGroupItem
                value="printed"
                id="printed"
                className="peer sr-only"
              />
              <Label
                htmlFor="printed"
                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Printer className="h-8 w-8 mb-3 text-primary" />
                <span className="font-semibold">Impressa</span>
                <span className="text-2xl font-bold text-primary mt-1">R$ 49,90</span>
                <span className="text-xs text-muted-foreground mt-2 text-center">
                  + frete • Enviada para seu endereço
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Shipping Address (only for printed) */}
      {planType === 'printed' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    placeholder="Nome da rua"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    value={address.number}
                    onChange={(e) => setAddress({ ...address, number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Apto, sala, etc."
                    value={address.complement}
                    onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Nome do bairro"
                    value={address.neighborhood}
                    onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Nome da cidade"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="UF"
                    maxLength={2}
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary & Submit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-2xl font-bold">
              R$ {planType === 'digital' ? '29,90' : '49,90'}
              {planType === 'printed' && <span className="text-sm font-normal text-muted-foreground"> + frete</span>}
            </span>
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!photoUrl || submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Solicitar Carteirinha
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Após a solicitação, você receberá instruções para pagamento
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
