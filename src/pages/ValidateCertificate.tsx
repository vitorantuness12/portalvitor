import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search, CheckCircle, XCircle, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsPwa } from '@/hooks/useIsPwa';
import { publicUrl } from '@/lib/site';

interface CertificateData {
  id: string;
  certificate_code: string;
  issued_at: string;
  courses: {
    title: string;
    duration_hours: number;
  };
  profiles: {
    full_name: string;
  };
  enrollments: {
    exam_score: number | null;
    exam_completed_at: string | null;
  } | null;
}

interface CertificateConfigType {
  institution_name: string | null;
  institution_subtitle: string | null;
  institution_logo_url: string | null;
  front_title: string | null;
  front_subtitle: string | null;
  front_completion_text: string | null;
  front_hours_text: string | null;
  front_date_text: string | null;
  front_score_text: string | null;
  signature_name: string | null;
  signature_title: string | null;
  signature_image_url: string | null;
  primary_color: string | null;
  text_color: string | null;
  background_color: string | null;
  show_qr_code: boolean | null;
  right_badge_url: string | null;
}

/** Réplica visual do certificado exibido no app, com QR de validação. */
function CertificateView({
  certificate,
  config,
  qrCodeDataUrl,
}: {
  certificate: CertificateData;
  config: CertificateConfigType | null;
  qrCodeDataUrl?: string;
}) {
  const primary = config?.primary_color || 'hsl(var(--primary))';
  const completionDate = certificate.enrollments?.exam_completed_at || certificate.issued_at;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-8 rounded-2xl">
      <div
        className="rounded-lg border-4 p-4 sm:p-8 shadow-lg relative"
        style={{
          backgroundColor: config?.background_color || '#FFFFFF',
          borderColor: primary,
        }}
      >
        {config?.right_badge_url && (
          <img
            src={config.right_badge_url}
            alt="Selo"
            className="absolute top-3 right-3 w-12 h-12 sm:w-16 sm:h-16 object-contain"
          />
        )}
        <div
          className="border rounded p-4 sm:p-6 text-center"
          style={{ borderColor: `${config?.primary_color || '#FF7026'}40` }}
        >
          {config?.institution_logo_url && (
            <img
              src={config.institution_logo_url}
              alt="Logo"
              className="w-16 h-16 object-contain mx-auto mb-2"
            />
          )}
          <p className="text-2xl font-display font-bold mb-2" style={{ color: primary }}>
            {config?.institution_name || 'Formak'}
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: config?.text_color || 'inherit' }}
          >
            {config?.front_title || 'Certificado de Conclusão'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
            {config?.institution_subtitle || 'Curso Livre Online'}
          </p>

          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
            {config?.front_subtitle || 'Certificamos que'}
          </p>
          <p
            className="text-xl sm:text-2xl font-bold mb-4"
            style={{ color: config?.text_color || 'inherit' }}
          >
            {certificate.profiles?.full_name}
          </p>

          <p className="text-xs text-muted-foreground mb-2">
            {config?.front_completion_text || 'concluiu com êxito o curso'}
          </p>
          <p className="text-lg sm:text-xl font-bold mb-6" style={{ color: primary }}>
            {certificate.courses?.title}
          </p>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">
                {config?.front_hours_text || 'Carga Horária'}
              </p>
              <p className="font-bold">{certificate.courses?.duration_hours} horas</p>
            </div>
            {certificate.enrollments?.exam_score != null && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">
                  {config?.front_score_text || 'Nota Final'}
                </p>
                <p className="font-bold">{Number(certificate.enrollments.exam_score).toFixed(1)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase">
                {config?.front_date_text || 'Conclusão'}
              </p>
              <p className="font-bold">
                {format(new Date(completionDate), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="mb-4">
            {config?.signature_image_url && (
              <img
                src={config.signature_image_url}
                alt="Assinatura"
                className="h-10 object-contain mx-auto mb-1"
              />
            )}
            <div className="border-t border-border w-40 mx-auto pt-2">
              <p className="text-sm font-semibold">
                {config?.signature_name || 'Diretor(a) Acadêmico(a)'}
              </p>
              <p className="text-xs text-muted-foreground">
                {config?.signature_title || config?.institution_name || 'Formak'}
              </p>
            </div>
          </div>

          {config?.show_qr_code !== false && qrCodeDataUrl && (
            <div className="flex flex-col items-center gap-1 mb-4">
              <img src={qrCodeDataUrl} alt="QR Code de validação" className="w-24 h-24" />
              <p className="text-[10px] text-muted-foreground">Escaneie para validar</p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Código de Validação:{' '}
              <span className="font-mono font-bold">{certificate.certificate_code}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ValidateCertificate() {
  const [searchParams, setSearchParams] = useSearchParams();
  const codeFromUrl = (searchParams.get('codigo') || searchParams.get('code') || '').toUpperCase();
  const [code, setCode] = useState(codeFromUrl);
  const isPwa = useIsPwa();
  const [isValidating, setIsValidating] = useState(false);
  const [config, setConfig] = useState<CertificateConfigType | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>();
  const [result, setResult] = useState<{
    valid: boolean;
    certificate?: CertificateData;
  } | null>(null);

  useEffect(() => {
    supabase
      .from('certificate_config')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setConfig((data as unknown as CertificateConfigType) ?? null));
  }, []);

  const validate = useCallback(async (rawCode: string) => {
    const target = rawCode.trim().toUpperCase();
    if (!target) return;

    setIsValidating(true);
    setResult(null);
    setQrCodeDataUrl(undefined);

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(
          'id, certificate_code, issued_at, courses(title, duration_hours), profiles!certificates_user_id_fkey(full_name), enrollments(exam_score, exam_completed_at)',
        )
        .eq('certificate_code', target)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResult({ valid: true, certificate: data as unknown as CertificateData });
        try {
          setQrCodeDataUrl(
            await QRCode.toDataURL(publicUrl(`/validar-certificado?codigo=${target}`), {
              width: 200,
              margin: 1,
            }),
          );
        } catch {
          /* QR opcional */
        }
      } else {
        setResult({ valid: false });
      }
    } catch (err) {
      console.error('Error validating certificate:', err);
      setResult({ valid: false });
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Validação automática quando o código vem pela URL (QR do app).
  useEffect(() => {
    if (codeFromUrl) {
      setCode(codeFromUrl);
      validate(codeFromUrl);
    }
  }, [codeFromUrl, validate]);

  const handleValidate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const target = code.trim().toUpperCase();
    if (!target) return;
    setSearchParams({ codigo: target }, { replace: true });
    validate(target);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">Validar Certificado</h1>
              <p className="text-muted-foreground">
                Verifique a autenticidade de um certificado emitido pela nossa plataforma
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Digite o código do certificado</CardTitle>
                <CardDescription>
                  O código está localizado no certificado, geralmente no formato ABCD-1234-EFGH
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidate} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ex: ABCD-1234-EFGH"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="pl-9 font-mono"
                        maxLength={20}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isValidating || !code.trim()}
                      className="w-full sm:w-auto"
                    >
                      {isValidating ? 'Validando...' : 'Validar'}
                    </Button>
                  </div>
                </form>

                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    {result.valid && result.certificate ? (
                      <div className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-800 dark:text-green-200">
                              Certificado Válido
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Emitido em{' '}
                              {format(
                                new Date(result.certificate.issued_at),
                                "dd 'de' MMMM 'de' yyyy",
                                { locale: ptBR },
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className="font-mono ml-auto hidden sm:flex">
                            {result.certificate.certificate_code}
                          </Badge>
                        </div>

                        <CertificateView
                          certificate={result.certificate}
                          config={config}
                          qrCodeDataUrl={qrCodeDataUrl}
                        />
                      </div>
                    ) : (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-red-800 dark:text-red-200">
                              Certificado não encontrado
                            </h3>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              Não foi possível encontrar um certificado com este código. Verifique
                              se o código foi digitado corretamente.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Em caso de dúvidas sobre a validade de um certificado, entre em contato conosco.
            </p>
          </motion.div>
        </div>
      </main>

      {!isPwa && <Footer />}
    </div>
  );
}
