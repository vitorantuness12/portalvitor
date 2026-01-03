import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Search, CheckCircle, XCircle, Award, GraduationCap, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

export default function ValidateCertificate() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    certificate?: CertificateData;
  } | null>(null);

  const handleValidate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!code.trim()) return;

    setIsValidating(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('id, certificate_code, issued_at, courses(title, duration_hours), profiles!certificates_user_id_fkey(full_name)')
        .eq('certificate_code', code.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResult({ valid: true, certificate: data as unknown as CertificateData });
      } else {
        setResult({ valid: false });
      }
    } catch (error) {
      console.error('Error validating certificate:', error);
      setResult({ valid: false });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">
                Validar Certificado
              </h1>
              <p className="text-muted-foreground">
                Verifique a autenticidade de um certificado emitido pela nossa plataforma
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Digite o código do certificado</CardTitle>
                <CardDescription>
                  O código está localizado no certificado, geralmente no formato CERT-XXXXXX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleValidate} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ex: CERT-ABC123"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="pl-9 font-mono"
                        maxLength={20}
                      />
                    </div>
                    <Button type="submit" disabled={isValidating || !code.trim()} className="w-full sm:w-auto">
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
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-green-800 dark:text-green-200">
                              Certificado Válido
                            </h3>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Este certificado é autêntico e foi emitido pela nossa plataforma
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-background/50 rounded-lg p-4 space-y-4">
                          <div className="flex items-start gap-3">
                            <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Aluno</p>
                              <p className="font-medium">{result.certificate.profiles.full_name}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm text-muted-foreground">Curso</p>
                              <p className="font-medium">{result.certificate.courses.title}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Emitido em</p>
                                <p className="font-medium text-sm sm:text-base">
                                  {format(
                                    new Date(result.certificate.issued_at),
                                    "dd 'de' MMMM 'de' yyyy",
                                    { locale: ptBR }
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-muted-foreground">Carga horária</p>
                                <p className="font-medium text-sm sm:text-base">
                                  {result.certificate.courses.duration_hours} horas
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Código</span>
                              <Badge variant="outline" className="font-mono">
                                {result.certificate.certificate_code}
                              </Badge>
                            </div>
                          </div>
                        </div>
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
                              Não foi possível encontrar um certificado com este código. 
                              Verifique se o código foi digitado corretamente.
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

      <Footer />
    </div>
  );
}
