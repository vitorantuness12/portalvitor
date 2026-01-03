import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Download, ArrowLeft, CheckCircle, Share2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Image } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf', fontWeight: 700 },
  ],
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  container: {
    flex: 1,
    margin: 30,
    padding: 40,
    border: '3px solid #2563EB',
    borderRadius: 8,
  },
  innerBorder: {
    flex: 1,
    border: '1px solid #93C5FD',
    borderRadius: 4,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontFamily: 'Montserrat',
    fontWeight: 700,
    color: '#2563EB',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Montserrat',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  body: {
    alignItems: 'center',
    marginVertical: 30,
    flex: 1,
    justifyContent: 'center',
  },
  certifyText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  studentName: {
    fontSize: 28,
    fontFamily: 'Montserrat',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  courseName: {
    fontSize: 18,
    fontFamily: 'Montserrat',
    fontWeight: 700,
    color: '#2563EB',
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: 400,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 10,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    fontWeight: 700,
    color: '#1E293B',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #E2E8F0',
  },
  code: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 10,
  },
  validationText: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 5,
  },
});

// Certificate PDF Document Component
interface CertificateDocProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  duration: number;
  score: number;
  certificateCode: string;
}

const CertificateDoc = ({ studentName, courseName, completionDate, duration, score, certificateCode }: CertificateDocProps) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.container}>
        <View style={styles.innerBorder}>
          <View style={styles.header}>
            <Text style={styles.logo}>EduPlatform</Text>
            <Text style={styles.title}>Certificado de Conclusão</Text>
            <Text style={styles.subtitle}>Curso Livre Online</Text>
          </View>
          
          <View style={styles.body}>
            <Text style={styles.certifyText}>Certificamos que</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.completedText}>concluiu com êxito o curso</Text>
            <Text style={styles.courseName}>{courseName}</Text>
            
            <View style={styles.details}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Carga Horária</Text>
                <Text style={styles.detailValue}>{duration} horas</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Nota Final</Text>
                <Text style={styles.detailValue}>{score.toFixed(1)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Data de Conclusão</Text>
                <Text style={styles.detailValue}>{completionDate}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.code}>Código de Validação: {certificateCode}</Text>
            <Text style={styles.validationText}>
              Valide este certificado em: eduplatform.com/validar/{certificateCode}
            </Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

// Generate unique certificate code
function generateCertificateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function CourseCertificate() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [certificateData, setCertificateData] = useState<CertificateDocProps | null>(null);

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch enrollment
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrollment', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch profile
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

  // Fetch existing certificate
  const { data: existingCertificate } = useQuery({
    queryKey: ['certificate', id, user?.id],
    queryFn: async () => {
      if (!user || !enrollment) return null;
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!enrollment,
  });

  // Create certificate mutation
  const createCertificateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !enrollment || !course) throw new Error('Dados incompletos');
      
      const certificateCode = generateCertificateCode();
      
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          user_id: user.id,
          course_id: course.id,
          enrollment_id: enrollment.id,
          certificate_code: certificateCode,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate', id] });
      toast({
        title: 'Certificado gerado!',
        description: 'Seu certificado está pronto para download.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao gerar certificado',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Prepare certificate data
  useEffect(() => {
    if (course && enrollment && profile && (existingCertificate || createCertificateMutation.data)) {
      const cert = existingCertificate || createCertificateMutation.data;
      setCertificateData({
        studentName: profile.full_name,
        courseName: course.title,
        completionDate: new Date(enrollment.exam_completed_at || enrollment.updated_at).toLocaleDateString('pt-BR'),
        duration: course.duration_hours,
        score: Number(enrollment.exam_score) || 0,
        certificateCode: cert.certificate_code,
      });
    }
  }, [course, enrollment, profile, existingCertificate, createCertificateMutation.data]);

  // Auto-generate certificate if eligible and doesn't exist
  useEffect(() => {
    if (enrollment?.status === 'passed' && !existingCertificate && !createCertificateMutation.isPending && !createCertificateMutation.data) {
      createCertificateMutation.mutate();
    }
  }, [enrollment, existingCertificate]);

  // Redirect if not eligible
  useEffect(() => {
    if (!enrollmentLoading && enrollment && enrollment.status !== 'passed') {
      navigate(`/curso/${id}/estudar`);
    }
  }, [enrollment, enrollmentLoading, navigate, id]);

  if (courseLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-[500px] w-full max-w-4xl mx-auto rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course || !enrollment || enrollment.status !== 'passed') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <Link
            to={`/curso/${id}/estudar`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o curso
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                <Award className="h-8 w-8 text-success" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-2">
                Parabéns pela conquista!
              </h1>
              <p className="text-muted-foreground">
                Você concluiu o curso com sucesso. Baixe seu certificado abaixo.
              </p>
            </div>

            {/* Certificate Preview */}
            <Card className="mb-8 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                  <div className="bg-white rounded-lg border-4 border-primary p-8 shadow-lg">
                    <div className="border border-primary/30 rounded p-6 text-center">
                      <p className="text-2xl font-display font-bold text-primary mb-2">
                        EduPlatform
                      </p>
                      <h2 className="text-3xl font-bold mb-1">Certificado de Conclusão</h2>
                      <p className="text-sm text-muted-foreground mb-8">Curso Livre Online</p>
                      
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                        Certificamos que
                      </p>
                      <p className="text-2xl font-bold mb-4">{profile?.full_name}</p>
                      
                      <p className="text-xs text-muted-foreground mb-2">concluiu com êxito o curso</p>
                      <p className="text-xl font-bold text-primary mb-6">{course.title}</p>
                      
                      <div className="flex justify-center gap-12 mb-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase">Carga Horária</p>
                          <p className="font-bold">{course.duration_hours} horas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase">Nota Final</p>
                          <p className="font-bold">{Number(enrollment.exam_score).toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase">Conclusão</p>
                          <p className="font-bold">
                            {new Date(enrollment.exam_completed_at || enrollment.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Código de Validação: <span className="font-mono font-bold">
                            {existingCertificate?.certificate_code || createCertificateMutation.data?.certificate_code || '...'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {certificateData ? (
                <PDFDownloadLink
                  document={<CertificateDoc {...certificateData} />}
                  fileName={`certificado-${course.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
                >
                  {({ loading }) => (
                    <Button variant="hero" size="lg" disabled={loading}>
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground" />
                          Preparando...
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5" />
                          Baixar Certificado PDF
                        </>
                      )}
                    </Button>
                  )}
                </PDFDownloadLink>
              ) : (
                <Button variant="hero" size="lg" disabled>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground" />
                  Gerando certificado...
                </Button>
              )}
              
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
                Compartilhar
              </Button>
            </div>

            {/* Validation Info */}
            <div className="mt-8 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                Este certificado pode ser validado através do código único em nossa plataforma.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
