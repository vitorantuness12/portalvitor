import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  CreditCard,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Shield,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo from '@/assets/logo_formak.png';
import { useIsPwa } from '@/hooks/useIsPwa';

type StudentCardWithProfile = {
  id: string;
  card_code: string;
  photo_url: string | null;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled';
  issued_at: string | null;
  expires_at: string | null;
  profile?: {
    full_name: string;
  };
};

export default function ValidateStudentCard() {
  const [searchParams] = useSearchParams();
  const isPwa = useIsPwa();
  const [code, setCode] = useState(searchParams.get('codigo') || '');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<StudentCardWithProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const codigoParam = searchParams.get('codigo');
    if (codigoParam) {
      setCode(codigoParam);
      handleSearch(codigoParam);
    }
  }, [searchParams]);

  const handleSearch = async (searchCode?: string) => {
    const codeToSearch = searchCode || code;
    if (!codeToSearch.trim()) {
      setError('Digite um código para buscar');
      return;
    }

    setSearching(true);
    setError(null);
    setResult(null);
    setHasSearched(true);

    try {
      // First get the student card
      const { data: cardData, error: cardError } = await (supabase
        .from('student_cards') as any)
        .select('*')
        .eq('card_code', codeToSearch.toUpperCase().trim())
        .maybeSingle();

      if (cardError) throw cardError;

      if (!cardData) {
        setError('Carteirinha não encontrada');
        return;
      }

      // Then get the profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', cardData.user_id)
        .maybeSingle();

      setResult({
        ...cardData,
        profile: profileData || undefined,
      } as StudentCardWithProfile);
    } catch (err) {
      console.error('Error searching student card:', err);
      setError('Erro ao buscar carteirinha. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const isValid = result?.status === 'active' && 
    result.expires_at && 
    new Date(result.expires_at) > new Date();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2">
              Validar Carteirinha de Estudante
            </h1>
            <p className="text-muted-foreground">
              Digite o código da carteirinha para verificar sua autenticidade
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Ex: CARD-ABC123"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg"
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error ? (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center p-4 bg-destructive/10 rounded-full mb-4">
                        <XCircle className="h-8 w-8 text-destructive" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Carteirinha Não Encontrada</h3>
                      <p className="text-muted-foreground">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : result ? (
                <Card className={isValid ? 'border-emerald-500' : 'border-destructive'}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Resultado da Validação
                      </CardTitle>
                      {isValid ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Válida
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          {result.status === 'expired' || (result.expires_at && new Date(result.expires_at) < new Date())
                            ? 'Expirada'
                            : result.status === 'cancelled'
                            ? 'Cancelada'
                            : 'Inválida'}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-6">
                      {/* Photo */}
                      <div className="w-24 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {result.photo_url ? (
                          <img
                            src={result.photo_url}
                            alt="Foto do estudante"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Nome do Estudante</p>
                          <p className="font-semibold text-lg">
                            {result.profile?.full_name || 'Nome não disponível'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Código</p>
                            <p className="font-mono font-medium">{result.card_code}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Válida até</p>
                            <p className="font-medium">
                              {result.expires_at
                                ? format(new Date(result.expires_at), 'dd/MM/yyyy', { locale: ptBR })
                                : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Institution */}
                    <div className="mt-6 pt-4 border-t flex items-center gap-3">
                      <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
                      <div>
                        <p className="font-semibold">Formak</p>
                        <p className="text-sm text-muted-foreground">Educação Online de Qualidade</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </motion.div>
          )}

          {/* Info */}
          {!hasSearched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Como validar?</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        1
                      </span>
                      <span>Digite o código da carteirinha (ex: CARD-ABC123) no campo acima</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        2
                      </span>
                      <span>Clique no botão de busca ou pressione Enter</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        3
                      </span>
                      <span>Verifique se os dados conferem com a carteirinha apresentada</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
      {!isPwa && <Footer />}
    </div>
  );
}
