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
import { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Image, Svg, Path, Line, Rect } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// Register fonts
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf', fontWeight: 700 },
  ],
});

// Constants for A4 landscape
const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const WAVE_VIEWBOX_WIDTH = 400;
const WAVE_BOTTOM_VIEWBOX_HEIGHT = 160;
const WAVE_TOP_VIEWBOX_HEIGHT = 100;

// Wave SVG components - matching the preview styles
const WaveBottomCurves = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.18 }}>
    <Path d="M0,80 Q100,40 200,80 T400,80 L400,160 L0,160 Z" fill={primaryColor} />
    <Path d="M0,85 Q100,50 200,85 T400,85" fill="none" stroke={secondaryColor} strokeWidth={2} />
    <Path d="M0,100 Q150,70 300,100 T400,90 L400,160 L0,160 Z" fill={primaryColor} opacity={0.8} />
  </Svg>
);

const WaveBottomGeometric = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.18 }}>
    <Path d="M0,100 L80,60 L160,90 L240,50 L320,80 L400,40 L400,160 L0,160 Z" fill={primaryColor} />
    <Path d="M0,105 L80,65 L160,95 L240,55 L320,85 L400,45" fill="none" stroke={secondaryColor} strokeWidth={2} />
    <Path d="M0,120 L100,90 L200,110 L300,80 L400,100 L400,160 L0,160 Z" fill={primaryColor} opacity={0.8} />
  </Svg>
);

const WaveBottomLines = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.18 }}>
    <Rect x={0} y={80} width={400} height={80} fill={primaryColor} />
    <Line x1={0} y1={80} x2={400} y2={80} stroke={secondaryColor} strokeWidth={3} />
    <Line x1={0} y1={90} x2={400} y2={90} stroke={secondaryColor} strokeWidth={1} opacity={0.5} />
    <Line x1={0} y1={100} x2={400} y2={100} stroke={secondaryColor} strokeWidth={1} opacity={0.3} />
    <Line x1={0} y1={160} x2={40} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={100} y1={160} x2={140} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={200} y1={160} x2={240} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={300} y1={160} x2={340} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
  </Svg>
);

const WaveBottomDiagonal = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.18 }}>
    <Path d="M0,120 L400,60 L400,160 L0,160 Z" fill={primaryColor} />
    <Path d="M0,110 L400,50" fill="none" stroke={secondaryColor} strokeWidth={2} />
    <Path d="M0,140 L400,80 L400,160 L0,160 Z" fill={primaryColor} opacity={0.8} />
  </Svg>
);

const WaveTopCurves = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.12 }}>
    <Path d="M0,0 L400,0 L400,60 Q300,90 200,60 T0,60 Z" fill={primaryColor} />
    <Path d="M0,65 Q100,95 200,65 T400,65" fill="none" stroke={secondaryColor} strokeWidth={2} />
  </Svg>
);

const WaveTopGeometric = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.12 }}>
    <Path d="M0,0 L400,0 L400,50 L320,70 L240,40 L160,60 L80,30 L0,50 Z" fill={primaryColor} />
    <Path d="M0,55 L80,35 L160,65 L240,45 L320,75 L400,55" fill="none" stroke={secondaryColor} strokeWidth={2} />
  </Svg>
);

const WaveTopLines = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.12 }}>
    <Rect x={0} y={0} width={400} height={60} fill={primaryColor} />
    <Line x1={0} y1={60} x2={400} y2={60} stroke={secondaryColor} strokeWidth={3} />
    <Line x1={0} y1={50} x2={400} y2={50} stroke={secondaryColor} strokeWidth={1} opacity={0.5} />
    <Line x1={0} y1={40} x2={400} y2={40} stroke={secondaryColor} strokeWidth={1} opacity={0.3} />
    <Line x1={0} y1={0} x2={40} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={100} y1={0} x2={140} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={200} y1={0} x2={240} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={300} y1={0} x2={340} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
  </Svg>
);

const WaveTopDiagonal = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.12 }}>
    <Path d="M0,0 L400,0 L400,40 L0,80 Z" fill={primaryColor} />
    <Path d="M0,85 L400,45" fill="none" stroke={secondaryColor} strokeWidth={2} />
  </Svg>
);

// Wave renderer functions
const renderBottomWave = (style: string, primaryColor: string, secondaryColor: string) => {
  switch (style) {
    case 'geometric':
      return <WaveBottomGeometric primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case 'lines':
      return <WaveBottomLines primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case 'diagonal':
      return <WaveBottomDiagonal primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case 'curves':
    default:
      return <WaveBottomCurves primaryColor={primaryColor} secondaryColor={secondaryColor} />;
  }
};

const renderTopWave = (style: string, primaryColor: string, secondaryColor: string) => {
  switch (style) {
    case 'geometric':
      return <WaveTopGeometric primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case 'lines':
      return <WaveTopLines primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case 'diagonal':
      return <WaveTopDiagonal primaryColor={primaryColor} secondaryColor={secondaryColor} />;
    case 'curves':
    default:
      return <WaveTopCurves primaryColor={primaryColor} secondaryColor={secondaryColor} />;
  }
};

// Certificate PDF Document Component
interface CertificateDocProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  duration: number;
  score: number;
  certificateCode: string;
  qrCodeDataUrl?: string;
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
  front_wave_style?: string | null;
  back_wave_style?: string | null;
  show_front_waves?: boolean | null;
  show_back_waves?: boolean | null;
  left_badge_url?: string | null;
  right_badge_url?: string | null;
  left_badge_text?: string | null;
  right_badge_text?: string | null;
}

// Badge/Seal SVG Component - Golden star icon
const BadgeStar = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
    <Path 
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
      fill={color}
    />
  </Svg>
);

const CertificateDoc = ({ studentName, courseName, completionDate, duration, score, certificateCode, qrCodeDataUrl, config }: CertificateDocProps) => {
  const primaryColor = config?.primary_color || '#FF7026';
  const secondaryColor = config?.secondary_color || '#D4AF37';
  const textColor = config?.text_color || '#1E3A5F';
  const backgroundColor = config?.background_color || '#FFFFFF';
  const institutionName = config?.institution_name || 'Formak';
  const frontTitle = config?.front_title || 'Certificado de Conclusão';
  const frontSubtitle = config?.front_subtitle || 'Certificamos que';
  const completionText = config?.front_completion_text || 'concluiu com êxito o curso';
  const validationUrl = config?.back_validation_url || 'formak.com.br/validar-certificado';
  const frontWaveStyle = config?.front_wave_style || 'curves';
  const backWaveStyle = config?.back_wave_style || 'curves';
  const showFrontWaves = config?.show_front_waves !== false;
  const showBackWaves = config?.show_back_waves !== false;

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: backgroundColor,
      position: 'relative',
    },
    borderFrame: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      bottom: 20,
      borderWidth: 2,
      borderColor: secondaryColor,
      borderRadius: 4,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      paddingBottom: 140,
      paddingHorizontal: 60,
      zIndex: 10,
    },
    header: {
      alignItems: 'center',
      marginBottom: 15,
    },
    logo: {
      height: 50,
      marginBottom: 10,
    },
    mainTitle: {
      fontSize: 32,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    subtitle: {
      fontSize: 14,
      color: textColor,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginTop: 4,
    },
    certifyText: {
      fontSize: 11,
      color: `${textColor}99`,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 15,
    },
    studentName: {
      fontSize: 34,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: secondaryColor,
      marginTop: 12,
      marginBottom: 12,
    },
    decorativeLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
    },
    lineSegment: {
      width: 60,
      height: 1,
      backgroundColor: secondaryColor,
    },
    lineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: secondaryColor,
      marginHorizontal: 10,
    },
    completionText: {
      fontSize: 11,
      color: `${textColor}80`,
      marginTop: 8,
    },
    courseName: {
      fontSize: 18,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      marginTop: 6,
      textAlign: 'center',
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 50,
      marginTop: 20,
    },
    detailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 8,
      color: `${textColor}80`,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 3,
    },
    detailValue: {
      fontSize: 12,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: textColor,
    },
    footer: {
      position: 'absolute',
      bottom: 70,
      left: 60,
      right: 60,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      zIndex: 20,
    },
    footerItem: {
      alignItems: 'center',
    },
    footerLine: {
      width: 100,
      height: 1,
      backgroundColor: textColor,
      marginBottom: 5,
    },
    footerLabel: {
      fontSize: 10,
      color: textColor,
    },
    signatureImage: {
      width: 100,
      height: 35,
      marginBottom: 5,
    },
    validationFooter: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 25,
    },
    validationCode: {
      fontSize: 9,
      color: `${textColor}80`,
    },
    validationUrlText: {
      fontSize: 8,
      color: `${textColor}60`,
      marginTop: 2,
    },
    // Back page styles
    backContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 90,
      paddingBottom: 60,
      paddingHorizontal: 80,
      zIndex: 10,
    },
    backTitle: {
      fontSize: 16,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 25,
    },
    backText: {
      fontSize: 11,
      color: textColor,
      textAlign: 'center',
      lineHeight: 1.6,
      maxWidth: 480,
      marginBottom: 25,
    },
    backValidationText: {
      fontSize: 9,
      color: `${textColor}80`,
    },
    backValidationUrl: {
      fontSize: 13,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      marginTop: 4,
    },
    codeText: {
      fontSize: 11,
      color: secondaryColor,
      marginTop: 8,
    },
    scanText: {
      fontSize: 8,
      color: `${textColor}80`,
      marginBottom: 15,
    },
    // Badge/Seal styles
    badgeLeft: {
      position: 'absolute',
      top: 35,
      left: 35,
      alignItems: 'center',
      zIndex: 30,
    },
    badgeRight: {
      position: 'absolute',
      top: 35,
      right: 35,
      alignItems: 'center',
      zIndex: 30,
    },
    badgeCircle: {
      width: 60,
      height: 60,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    badgeText: {
      fontSize: 6,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      textTransform: 'uppercase',
      marginTop: 4,
      letterSpacing: 0.5,
    },
    badgeImage: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
  });

  // Badge configuration
  const leftBadgeText = config?.left_badge_text || 'PREMIUM';
  const rightBadgeText = config?.right_badge_text || 'QUALIDADE';

  return (
    <Document>
      {/* Front Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Decorative waves - rendered first (behind content) */}
        {showFrontWaves && renderBottomWave(frontWaveStyle, primaryColor, secondaryColor)}
        
        {/* Border frame */}
        <View style={styles.borderFrame} />

        {/* Right Badge/Seal */}
        <View style={styles.badgeRight}>
          {config?.right_badge_url ? (
            <Image src={config.right_badge_url} style={styles.badgeImage} />
          ) : (
            <View style={[styles.badgeCircle, { backgroundColor: secondaryColor, borderColor: secondaryColor }]}>
              <BadgeStar color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            {config?.institution_logo_url && (
              <Image src={config.institution_logo_url} style={{ height: 50, objectFit: 'contain' }} />
            )}
            <Text style={styles.mainTitle}>{frontTitle}</Text>
            <Text style={styles.subtitle}>{config?.institution_subtitle || 'Curso Livre Online'}</Text>
          </View>

          <Text style={styles.certifyText}>{frontSubtitle}</Text>
          <Text style={styles.studentName}>{studentName}</Text>

          {/* Decorative line */}
          <View style={styles.decorativeLine}>
            <View style={styles.lineSegment} />
            <View style={styles.lineDot} />
            <View style={styles.lineSegment} />
          </View>

          <Text style={styles.completionText}>{completionText}</Text>
          <Text style={styles.courseName}>{courseName}</Text>

          {/* Course details */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{config?.front_hours_text || 'Carga Horária'}</Text>
              <Text style={styles.detailValue}>{duration} horas</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{config?.front_score_text || 'Nota Final'}</Text>
              <Text style={styles.detailValue}>{score.toFixed(1)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{config?.front_date_text || 'Data de Conclusão'}</Text>
              <Text style={styles.detailValue}>{completionDate}</Text>
            </View>
          </View>
        </View>

        {/* Footer with signature */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            {config?.signature_image_url && (
              <Image src={config.signature_image_url} style={styles.signatureImage} />
            )}
            <View style={styles.footerLine} />
            <Text style={styles.footerLabel}>{config?.signature_name || 'Diretor(a) Acadêmico(a)'}</Text>
            {config?.signature_title && (
              <Text style={{ fontSize: 8, color: `${textColor}80`, marginTop: 2 }}>{config.signature_title}</Text>
            )}
          </View>
          <View style={styles.footerItem}>
            <View style={styles.footerLine} />
            <Text style={styles.footerLabel}>{studentName}</Text>
            <Text style={{ fontSize: 8, color: `${textColor}80`, marginTop: 2 }}>Aluno(a)</Text>
          </View>
        </View>

        {/* Validation footer */}
        <View style={styles.validationFooter}>
          <Text style={styles.validationCode}>Código de Validação: {certificateCode}</Text>
          <Text style={styles.validationUrlText}>
            {config?.back_validation_text || 'Valide este certificado em:'} {validationUrl}
          </Text>
        </View>
      </Page>

      {/* Back Page */}
      {config?.show_back_side !== false && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          {/* Top Waves - rendered first to be behind content */}
          {showBackWaves && renderTopWave(backWaveStyle, primaryColor, secondaryColor)}

          {/* Border frame */}
          <View style={styles.borderFrame} />

          {/* Content */}
          <View style={styles.backContent}>
            {config?.institution_logo_url && (
              <Image src={config.institution_logo_url} style={{ width: 50, height: 50, marginBottom: 15, objectFit: 'contain' }} />
            )}

            <Text style={styles.backTitle}>
              {config?.back_title || 'INFORMAÇÕES DO CERTIFICADO'}
            </Text>

            <Text style={styles.backText}>
              {config?.back_content || 'Este certificado é válido em todo território nacional como curso livre, conforme a Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04.'}
            </Text>

            {config?.show_qr_code !== false && qrCodeDataUrl && (
              <>
                <Image 
                  src={qrCodeDataUrl} 
                  style={{ width: 80, height: 80, marginBottom: 12 }} 
                />
                <Text style={styles.scanText}>Escaneie para validar</Text>
              </>
            )}

            <Text style={styles.backValidationText}>
              {config?.back_validation_text || 'Para validar este certificado, acesse:'}
            </Text>
            <Text style={styles.backValidationUrl}>
              {validationUrl}
            </Text>
            <Text style={styles.codeText}>Código: {certificateCode}</Text>
          </View>
        </Page>
      )}
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
      
      // Check if certificate already exists for this enrollment
      const { data: existing } = await supabase
        .from('certificates')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .maybeSingle();
      
      if (existing) {
        // Certificate already exists, return it instead of creating a new one
        return existing;
      }
      
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['certificate', id] });
      if (data) {
        toast({
          title: 'Certificado pronto!',
          description: 'Seu certificado está pronto para download.',
        });
      }
    },
    onError: (error: any) => {
      // Ignore duplicate key error silently and refetch
      if (error.message?.includes('duplicate key')) {
        queryClient.invalidateQueries({ queryKey: ['certificate', id] });
        return;
      }
      toast({
        title: 'Erro ao gerar certificado',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Prepare certificate data with QR code
  useEffect(() => {
    const prepareCertificateData = async () => {
      if (course && enrollment && profile && (existingCertificate || createCertificateMutation.data)) {
        const cert = existingCertificate || createCertificateMutation.data;
        
        // Generate QR code for validation URL
        const baseUrl = window.location.origin;
        const validationUrl = `${baseUrl}/validar-certificado?codigo=${cert.certificate_code}`;
        
        let qrCodeDataUrl: string | undefined;
        try {
          qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
            width: 200,
            margin: 1,
            color: {
              dark: certConfig?.primary_color || '#1E3A5F',
              light: '#FFFFFF',
            },
          });
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
        
        setCertificateData({
          studentName: profile.full_name,
          courseName: course.title,
          completionDate: new Date(enrollment.exam_completed_at || enrollment.updated_at).toLocaleDateString('pt-BR'),
          duration: course.duration_hours,
          score: Number(enrollment.exam_score) || 0,
          certificateCode: cert.certificate_code,
          qrCodeDataUrl,
          config: certConfig,
        });
      }
    };
    
    prepareCertificateData();
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
                        {certConfig?.institution_name || 'Formak'}
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
                            {certConfig?.signature_title || certConfig?.institution_name || 'Formak'}
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
