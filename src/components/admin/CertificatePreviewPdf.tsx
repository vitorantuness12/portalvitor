import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Line, Rect, G } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9WXV0poK5.ttf', fontWeight: 400, fontStyle: 'italic' },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq_p6WXV0poK5.ttf', fontWeight: 700, fontStyle: 'italic' },
  ],
});

interface CertificateConfigData {
  institution_name?: string;
  institution_subtitle?: string | null;
  institution_logo_url?: string | null;
  front_title?: string;
  front_subtitle?: string | null;
  front_completion_text?: string | null;
  front_hours_text?: string | null;
  front_date_text?: string | null;
  front_score_text?: string | null;
  back_title?: string | null;
  back_content?: string | null;
  back_validation_text?: string | null;
  back_validation_url?: string | null;
  signature_name?: string | null;
  signature_title?: string | null;
  signature_image_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  text_color?: string | null;
  background_color?: string | null;
  accent_gradient?: boolean | null;
  border_style?: string | null;
  show_qr_code?: boolean | null;
  show_back_side?: boolean | null;
  left_badge_url?: string | null;
  right_badge_url?: string | null;
  left_badge_text?: string | null;
  right_badge_text?: string | null;
  front_wave_style?: string | null;
  back_wave_style?: string | null;
  show_front_waves?: boolean | null;
  show_back_waves?: boolean | null;
}

interface PreviewPdfProps {
  config: CertificateConfigData;
}

// Constants for A4 landscape
const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const WAVE_VIEWBOX_WIDTH = 400;
const WAVE_BOTTOM_VIEWBOX_HEIGHT = 160;
const WAVE_TOP_VIEWBOX_HEIGHT = 100;

// Wave SVG components that match the visual preview exactly
const WaveBottomCurves = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.35 }}>
    <Path d="M0,80 Q100,40 200,80 T400,80 L400,160 L0,160 Z" fill={primaryColor} />
    <Path d="M0,85 Q100,50 200,85 T400,85" fill="none" stroke={secondaryColor} strokeWidth={2} />
    <Path d="M0,100 Q150,70 300,100 T400,90 L400,160 L0,160 Z" fill={primaryColor} opacity={0.8} />
  </Svg>
);

const WaveBottomGeometric = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.35 }}>
    <Path d="M0,100 L80,60 L160,90 L240,50 L320,80 L400,40 L400,160 L0,160 Z" fill={primaryColor} />
    <Path d="M0,105 L80,65 L160,95 L240,55 L320,85 L400,45" fill="none" stroke={secondaryColor} strokeWidth={2} />
    <Path d="M0,120 L100,90 L200,110 L300,80 L400,100 L400,160 L0,160 Z" fill={primaryColor} opacity={0.8} />
  </Svg>
);

const WaveBottomLines = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.35 }}>
    <Rect x={0} y={80} width={400} height={80} fill={primaryColor} />
    <Line x1={0} y1={80} x2={400} y2={80} stroke={secondaryColor} strokeWidth={3} />
    <Line x1={0} y1={90} x2={400} y2={90} stroke={secondaryColor} strokeWidth={1} opacity={0.5} />
    <Line x1={0} y1={100} x2={400} y2={100} stroke={secondaryColor} strokeWidth={1} opacity={0.3} />
    {/* Diagonal accent lines */}
    <Line x1={0} y1={160} x2={40} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={50} y1={160} x2={90} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={100} y1={160} x2={140} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={150} y1={160} x2={190} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={200} y1={160} x2={240} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={250} y1={160} x2={290} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={300} y1={160} x2={340} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={350} y1={160} x2={390} y2={80} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
  </Svg>
);

const WaveBottomDiagonal = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_BOTTOM_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.35 }}>
    <Path d="M0,120 L400,60 L400,160 L0,160 Z" fill={primaryColor} />
    <Path d="M0,110 L400,50" fill="none" stroke={secondaryColor} strokeWidth={2} />
    <Path d="M0,140 L400,80 L400,160 L0,160 Z" fill={primaryColor} opacity={0.8} />
  </Svg>
);

const WaveTopCurves = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.22 }}>
    <Path d="M0,0 L400,0 L400,60 Q300,90 200,60 T0,60 Z" fill={primaryColor} />
    <Path d="M0,65 Q100,95 200,65 T400,65" fill="none" stroke={secondaryColor} strokeWidth={2} />
  </Svg>
);

const WaveTopGeometric = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.22 }}>
    <Path d="M0,0 L400,0 L400,50 L320,70 L240,40 L160,60 L80,30 L0,50 Z" fill={primaryColor} />
    <Path d="M0,55 L80,35 L160,65 L240,45 L320,75 L400,55" fill="none" stroke={secondaryColor} strokeWidth={2} />
  </Svg>
);

const WaveTopLines = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.22 }}>
    <Rect x={0} y={0} width={400} height={60} fill={primaryColor} />
    <Line x1={0} y1={60} x2={400} y2={60} stroke={secondaryColor} strokeWidth={3} />
    <Line x1={0} y1={50} x2={400} y2={50} stroke={secondaryColor} strokeWidth={1} opacity={0.5} />
    <Line x1={0} y1={40} x2={400} y2={40} stroke={secondaryColor} strokeWidth={1} opacity={0.3} />
    {/* Diagonal accent lines */}
    <Line x1={0} y1={0} x2={40} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={50} y1={0} x2={90} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={100} y1={0} x2={140} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={150} y1={0} x2={190} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={200} y1={0} x2={240} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={250} y1={0} x2={290} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={300} y1={0} x2={340} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
    <Line x1={350} y1={0} x2={390} y2={60} stroke={secondaryColor} strokeWidth={0.5} opacity={0.2} />
  </Svg>
);

const WaveTopDiagonal = ({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) => (
  <Svg viewBox={`0 0 ${WAVE_VIEWBOX_WIDTH} ${WAVE_TOP_VIEWBOX_HEIGHT}`} preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT * 0.22 }}>
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

export const CertificatePreviewPdf = ({ config }: PreviewPdfProps) => {
  const primaryColor = config.primary_color || '#1E3A5F';
  const secondaryColor = config.secondary_color || '#D4AF37';
  const textColor = config.text_color || '#1E3A5F';
  const backgroundColor = config.background_color || '#FFFFFF';
  const frontWaveStyle = config.front_wave_style || 'curves';
  const backWaveStyle = config.back_wave_style || 'curves';
  const showFrontWaves = config.show_front_waves !== false;
  const showBackWaves = config.show_back_waves !== false;

  // Sample data for preview
  const sampleData = {
    studentName: 'João da Silva',
    courseName: 'Desenvolvimento Web Completo',
    duration: 40,
    date: new Date().toLocaleDateString('pt-BR'),
    score: 9.5,
    code: 'ABC1-DEF2-GHI3',
  };

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
      width: 60,
      height: 60,
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
    institutionSubtitle: {
      fontSize: 9,
      color: `${textColor}60`,
      marginTop: 12,
      textAlign: 'center',
      maxWidth: 380,
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
    badge: {
      position: 'absolute',
      top: 35,
      alignItems: 'center',
    },
    badgeCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 6,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      textTransform: 'uppercase',
      marginTop: 4,
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
    qrPlaceholder: {
      width: 70,
      height: 70,
      borderWidth: 2,
      borderColor: primaryColor,
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    qrGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 50,
      height: 50,
    },
    qrCell: {
      width: 10,
      height: 10,
    },
    validationText: {
      fontSize: 9,
      color: `${textColor}80`,
    },
    validationUrl: {
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
  });

  // QR Code pattern matching the visual preview
  const qrPattern = [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24];

  return (
    <Document>
      {/* Front Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Border frame */}
        <View style={styles.borderFrame} />

        {/* Left Badge */}
        <View style={[styles.badge, { left: 35 }]}>
          {config.left_badge_url ? (
            <Image src={config.left_badge_url} style={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : (
            <View style={[styles.badgeCircle, { borderWidth: 2, borderColor: secondaryColor, backgroundColor: primaryColor }]}>
              <Text style={{ fontSize: 22, color: secondaryColor }}>★</Text>
            </View>
          )}
          <Text style={styles.badgeText}>{config.left_badge_text || 'PREMIUM'}</Text>
        </View>

        {/* Right Badge */}
        <View style={[styles.badge, { right: 35 }]}>
          {config.right_badge_url ? (
            <Image src={config.right_badge_url} style={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : (
            <View style={[styles.badgeCircle, { backgroundColor: secondaryColor }]}>
              <Text style={{ fontSize: 22, color: 'white' }}>★</Text>
            </View>
          )}
          <Text style={styles.badgeText}>{config.right_badge_text || 'QUALIDADE'}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            {config.institution_logo_url && (
              <Image src={config.institution_logo_url} style={styles.logo} />
            )}
            <Text style={styles.mainTitle}>
              {(config.front_title || 'CERTIFICADO').split(' ')[0]}
            </Text>
            <Text style={styles.subtitle}>
              {(config.front_title || 'CERTIFICADO DE CONCLUSÃO').split(' ').slice(1).join(' ') || 'DE CONCLUSÃO'}
            </Text>
          </View>

          <Text style={styles.certifyText}>
            {config.front_subtitle || 'Este certificado é orgulhosamente concedido a'}
          </Text>

          <Text style={styles.studentName}>{sampleData.studentName}</Text>

          <View style={styles.decorativeLine}>
            <View style={styles.lineSegment} />
            <View style={styles.lineDot} />
            <View style={styles.lineSegment} />
          </View>

          <Text style={styles.completionText}>
            {config.front_completion_text || 'pela conclusão com êxito do curso'}
          </Text>

          <Text style={styles.courseName}>{sampleData.courseName}</Text>

          <Text style={styles.institutionSubtitle}>
            {config.institution_subtitle || 'Certificado emitido após conclusão de todas as atividades e aprovação na avaliação final.'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <View style={styles.footerLine} />
            <Text style={styles.footerLabel}>{config.front_date_text || 'Data'}</Text>
          </View>
          <View style={styles.footerItem}>
            {config.signature_image_url && (
              <Image src={config.signature_image_url} style={styles.signatureImage} />
            )}
            <View style={[styles.footerLine, { width: 120 }]} />
            <Text style={styles.footerLabel}>{config.signature_name || 'Assinatura'}</Text>
          </View>
        </View>

        {/* Bottom Waves */}
        {showFrontWaves && renderBottomWave(frontWaveStyle, primaryColor, secondaryColor)}
      </Page>

      {/* Back Page */}
      {config.show_back_side !== false && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          {/* Border frame */}
          <View style={styles.borderFrame} />

          {/* Top Waves */}
          {showBackWaves && renderTopWave(backWaveStyle, primaryColor, secondaryColor)}

          {/* Content */}
          <View style={styles.backContent}>
            {config.institution_logo_url && (
              <Image src={config.institution_logo_url} style={{ width: 50, height: 50, marginBottom: 15, objectFit: 'contain' }} />
            )}

            <Text style={styles.backTitle}>
              {config.back_title || 'INFORMAÇÕES DO CERTIFICADO'}
            </Text>

            <Text style={styles.backText}>
              {config.back_content || 'Este certificado é válido em todo território nacional como curso livre, conforme a Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04.'}
            </Text>

            {config.show_qr_code !== false && (
              <>
                <View style={styles.qrPlaceholder}>
                  <View style={styles.qrGrid}>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <View 
                        key={i} 
                        style={[
                          styles.qrCell, 
                          { backgroundColor: qrPattern.includes(i) ? primaryColor : 'transparent' }
                        ]} 
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.scanText}>Escaneie para validar</Text>
              </>
            )}

            <Text style={styles.validationText}>
              {config.back_validation_text || 'Para validar este certificado, acesse:'}
            </Text>
            <Text style={styles.validationUrl}>
              {config.back_validation_url || 'formarensino.com.br/validar'}
            </Text>
            <Text style={styles.codeText}>Código: {sampleData.code}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};
