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
  config?: CertificateConfigType;
}

interface CertificateConfigType {
  institution_name: string;
  institution_subtitle: string | null;
  institution_logo_url: string | null;
  front_title: string;
  front_subtitle: string | null;
  front_completion_text: string | null;
  front_hours_text: string | null;
  front_date_text: string | null;
  front_score_text: string | null;
  back_title: string | null;
  back_content: string | null;
  back_validation_text: string | null;
  back_validation_url: string | null;
  signature_name: string | null;
  signature_title: string | null;
  signature_image_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  text_color: string | null;
  background_color: string | null;
  show_qr_code: boolean | null;
  show_back_side: boolean | null;
}

const CertificateDoc = ({ studentName, courseName, completionDate, duration, score, certificateCode, config }: CertificateDocProps) => {
  const primaryColor = config?.primary_color || '#2563EB';
  const textColor = config?.text_color || '#1E293B';
  const institutionName = config?.institution_name || 'Formar Ensino';
  const frontTitle = config?.front_title || 'Certificado de Conclusão';
  const frontSubtitle = config?.front_subtitle || 'Certificamos que';
  const completionText = config?.front_completion_text || 'concluiu com êxito o curso';
  const validationUrl = config?.back_validation_url || 'formarensino.com.br/validar-certificado';

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={[styles.container, { borderColor: primaryColor }]}>
          <View style={[styles.innerBorder, { borderColor: `${primaryColor}40` }]}>
            <View style={styles.header}>
              {config?.institution_logo_url && (
                <Image src={config.institution_logo_url} style={{ width: 60, height: 60, marginBottom: 10 }} />
              )}
              <Text style={[styles.logo, { color: primaryColor }]}>{institutionName}</Text>
              <Text style={[styles.title, { color: textColor }]}>{frontTitle}</Text>
              <Text style={styles.subtitle}>{config?.institution_subtitle || 'Curso Livre Online'}</Text>
            </View>
            
            <View style={styles.body}>
              <Text style={styles.certifyText}>{frontSubtitle}</Text>
              <Text style={[styles.studentName, { color: textColor }]}>{studentName}</Text>
              <Text style={styles.completedText}>{completionText}</Text>
              <Text style={[styles.courseName, { color: primaryColor }]}>{courseName}</Text>
              
              <View style={styles.details}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{config?.front_hours_text || 'Carga Horária'}</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{duration} horas</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{config?.front_score_text || 'Nota Final'}</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{score.toFixed(1)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{config?.front_date_text || 'Data de Conclusão'}</Text>
                  <Text style={[styles.detailValue, { color: textColor }]}>{completionDate}</Text>
                </View>
              </View>
            </View>
            
            {/* Signature */}
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              {config?.signature_image_url && (
                <Image src={config.signature_image_url} style={{ width: 100, height: 40, marginBottom: 5 }} />
              )}
              <View style={{ borderTop: '1px solid #CBD5E1', width: 150, paddingTop: 5, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontFamily: 'Montserrat', fontWeight: 700, color: textColor }}>
                  {config?.signature_name || 'Diretor(a) Acadêmico(a)'}
                </Text>
                <Text style={{ fontSize: 8, color: '#64748B' }}>
                  {config?.signature_title || institutionName}
                </Text>
              </View>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.code}>Código de Validação: {certificateCode}</Text>
              <Text style={styles.validationText}>
                {config?.back_validation_text || 'Valide este certificado em:'} {validationUrl}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

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

  // Fetch certificate config
  const { data: certConfig } = useQuery({
    queryKey: ['certificate-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_config')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as CertificateConfigType;
    },
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
        config: certConfig,
      });
    }
  }, [course, enrollment, profile, existingCertificate, createCertificateMutation.data, certConfig]);

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
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-8">
                  <div 
                    className="rounded-lg border-4 p-4 sm:p-8 shadow-lg"
                    style={{ 
                      backgroundColor: certConfig?.background_color || '#FFFFFF',
                      borderColor: certConfig?.primary_color || 'hsl(var(--primary))',
                    }}
                  >
                    <div 
                      className="border rounded p-4 sm:p-6 text-center"
                      style={{ borderColor: `${certConfig?.primary_color || 'hsl(var(--primary))'}40` }}
                    >
                      {certConfig?.institution_logo_url && (
                        <img 
                          src={certConfig.institution_logo_url} 
                          alt="Logo" 
                          className="w-16 h-16 object-contain mx-auto mb-2"
                        />
                      )}
                      <p 
                        className="text-2xl font-display font-bold mb-2"
                        style={{ color: certConfig?.primary_color || 'hsl(var(--primary))' }}
                      >
                        {certConfig?.institution_name || 'Formar Ensino'}
                      </p>
                      <h2 
                        className="text-2xl sm:text-3xl font-bold mb-1"
                        style={{ color: certConfig?.text_color || 'inherit' }}
                      >
                        {certConfig?.front_title || 'Certificado de Conclusão'}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
                        {certConfig?.institution_subtitle || 'Curso Livre Online'}
                      </p>
                      
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                        {certConfig?.front_subtitle || 'Certificamos que'}
                      </p>
                      <p 
                        className="text-xl sm:text-2xl font-bold mb-4"
                        style={{ color: certConfig?.text_color || 'inherit' }}
                      >
                        {profile?.full_name}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {certConfig?.front_completion_text || 'concluiu com êxito o curso'}
                      </p>
                      <p 
                        className="text-lg sm:text-xl font-bold mb-6"
                        style={{ color: certConfig?.primary_color || 'hsl(var(--primary))' }}
                      >
                        {course.title}
                      </p>
                      
                      <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase">
                            {certConfig?.front_hours_text || 'Carga Horária'}
                          </p>
                          <p className="font-bold">{course.duration_hours} horas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase">Nota Final</p>
                          <p className="font-bold">{Number(enrollment.exam_score).toFixed(1)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground uppercase">
                            {certConfig?.front_date_text || 'Conclusão'}
                          </p>
                          <p className="font-bold">
                            {new Date(enrollment.exam_completed_at || enrollment.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Signature */}
                      <div className="mb-4">
                        {certConfig?.signature_image_url && (
                          <img 
                            src={certConfig.signature_image_url} 
                            alt="Assinatura" 
                            className="h-10 object-contain mx-auto mb-1"
                          />
                        )}
                        <div className="border-t border-border w-40 mx-auto pt-2">
                          <p className="text-sm font-semibold">
                            {certConfig?.signature_name || 'Diretor(a) Acadêmico(a)'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {certConfig?.signature_title || certConfig?.institution_name || 'Formar Ensino'}
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
