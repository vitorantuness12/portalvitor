import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Award, CheckCircle, XCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminCertificates() {
  const [search, setSearch] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    certificate?: any;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*, courses(title), profiles!certificates_user_id_fkey(full_name, email)')
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleValidate = async () => {
    if (!validationCode.trim()) {
      toast.error('Digite um código para validar');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*, courses(title), profiles!certificates_user_id_fkey(full_name, email)')
        .eq('certificate_code', validationCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setValidationResult({ valid: true, certificate: data });
        toast.success('Certificado válido!');
      } else {
        setValidationResult({ valid: false });
        toast.error('Certificado não encontrado');
      }
    } catch (error) {
      console.error('Error validating certificate:', error);
      toast.error('Erro ao validar certificado');
    } finally {
      setIsValidating(false);
    }
  };

  const filteredCertificates = certificates?.filter((cert) => {
    const searchLower = search.toLowerCase();
    return (
      cert.certificate_code.toLowerCase().includes(searchLower) ||
      (cert.profiles as any)?.full_name?.toLowerCase().includes(searchLower) ||
      (cert.profiles as any)?.email?.toLowerCase().includes(searchLower) ||
      (cert.courses as any)?.title?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Certificados</h1>
        <p className="text-muted-foreground">
          Visualize e valide os certificados emitidos
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Validar Certificado
            </CardTitle>
            <CardDescription>
              Digite o código do certificado para verificar autenticidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ex: CERT-XXXXXX"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
              />
              <Button onClick={handleValidate} disabled={isValidating}>
                {isValidating ? 'Validando...' : 'Validar'}
              </Button>
            </div>

            {validationResult && (
              <div
                className={`p-4 rounded-lg border ${
                  validationResult.valid
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                }`}
              >
                {validationResult.valid ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Certificado Válido</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Aluno:</span>{' '}
                        {(validationResult.certificate.profiles as any)?.full_name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Curso:</span>{' '}
                        {(validationResult.certificate.courses as any)?.title}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Emitido em:</span>{' '}
                        {format(
                          new Date(validationResult.certificate.issued_at),
                          "dd 'de' MMMM 'de' yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Certificado não encontrado</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Estatísticas
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{certificates?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total emitidos</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(certificates?.map((c) => c.course_id)).size || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Cursos distintos</p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {new Set(certificates?.map((c) => c.user_id)).size || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Alunos certificados</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, aluno ou curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Emitido em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCertificates?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum certificado encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredCertificates?.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {cert.certificate_code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {(cert.profiles as any)?.full_name || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(cert.profiles as any)?.email || 'N/A'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{(cert.courses as any)?.title || 'N/A'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cert.issued_at
                      ? format(new Date(cert.issued_at), "dd 'de' MMM, yyyy", {
                          locale: ptBR,
                        })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
