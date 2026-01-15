import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Path, Line, Rect } from '@react-pdf/renderer';

// Register fonts
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf', fontWeight: 700 },
  ],
});

Font.register({
  family: 'Georgia',
  src: 'https://fonts.cdnfonts.com/s/14903/georgia.woff',
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

// Wave path generators for PDF
const getWavePath = (style: string, position: 'bottom' | 'top', width: number, height: number) => {
  if (position === 'bottom') {
    switch (style) {
      case 'geometric':
        return `M0,${height * 0.6} L${width * 0.2},${height * 0.35} L${width * 0.4},${height * 0.55} L${width * 0.6},${height * 0.3} L${width * 0.8},${height * 0.5} L${width},${height * 0.25} L${width},${height} L0,${height} Z`;
      case 'lines':
        return `M0,${height * 0.5} L${width},${height * 0.5} L${width},${height} L0,${height} Z`;
      case 'diagonal':
        return `M0,${height * 0.75} L${width},${height * 0.35} L${width},${height} L0,${height} Z`;
      case 'curves':
      default:
        return `M0,${height * 0.5} Q${width * 0.25},${height * 0.25} ${width * 0.5},${height * 0.5} T${width},${height * 0.5} L${width},${height} L0,${height} Z`;
    }
  } else {
    switch (style) {
      case 'geometric':
        return `M0,0 L${width},0 L${width},${height * 0.5} L${width * 0.8},${height * 0.7} L${width * 0.6},${height * 0.4} L${width * 0.4},${height * 0.6} L${width * 0.2},${height * 0.35} L0,${height * 0.5} Z`;
      case 'lines':
        return `M0,0 L${width},0 L${width},${height * 0.6} L0,${height * 0.6} Z`;
      case 'diagonal':
        return `M0,0 L${width},0 L${width},${height * 0.4} L0,${height * 0.8} Z`;
      case 'curves':
      default:
        return `M0,0 L${width},0 L${width},${height * 0.6} Q${width * 0.75},${height * 0.9} ${width * 0.5},${height * 0.6} T0,${height * 0.6} Z`;
    }
  }
};

const getAccentPath = (style: string, position: 'bottom' | 'top', width: number, height: number) => {
  if (position === 'bottom') {
    switch (style) {
      case 'geometric':
        return `M0,${height * 0.65} L${width * 0.2},${height * 0.4} L${width * 0.4},${height * 0.6} L${width * 0.6},${height * 0.35} L${width * 0.8},${height * 0.55} L${width},${height * 0.3}`;
      case 'lines':
        return `M0,${height * 0.5} L${width},${height * 0.5}`;
      case 'diagonal':
        return `M0,${height * 0.7} L${width},${height * 0.3}`;
      case 'curves':
      default:
        return `M0,${height * 0.53} Q${width * 0.25},${height * 0.3} ${width * 0.5},${height * 0.53} T${width},${height * 0.53}`;
    }
  } else {
    switch (style) {
      case 'geometric':
        return `M0,${height * 0.55} L${width * 0.2},${height * 0.4} L${width * 0.4},${height * 0.65} L${width * 0.6},${height * 0.45} L${width * 0.8},${height * 0.75} L${width},${height * 0.55}`;
      case 'lines':
        return `M0,${height * 0.6} L${width},${height * 0.6}`;
      case 'diagonal':
        return `M0,${height * 0.85} L${width},${height * 0.45}`;
      case 'curves':
      default:
        return `M0,${height * 0.65} Q${width * 0.25},${height * 0.95} ${width * 0.5},${height * 0.65} T${width},${height * 0.65}`;
    }
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

  const pageWidth = 842; // A4 landscape width in points
  const pageHeight = 595; // A4 landscape height in points
  const waveHeight = pageHeight * 0.35;

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
      paddingBottom: 120,
      paddingHorizontal: 60,
      zIndex: 10,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
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
      fontSize: 12,
      color: `${textColor}99`,
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginTop: 20,
    },
    studentName: {
      fontSize: 36,
      fontFamily: 'Georgia',
      fontWeight: 700,
      color: secondaryColor,
      marginTop: 15,
      marginBottom: 15,
      fontStyle: 'italic',
    },
    decorativeLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
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
      fontSize: 12,
      color: `${textColor}80`,
      marginTop: 10,
    },
    courseName: {
      fontSize: 20,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      marginTop: 8,
      textAlign: 'center',
    },
    institutionSubtitle: {
      fontSize: 10,
      color: `${textColor}60`,
      marginTop: 15,
      textAlign: 'center',
      maxWidth: 400,
    },
    footer: {
      position: 'absolute',
      bottom: 80,
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
      top: 40,
      alignItems: 'center',
    },
    badgeCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 6,
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
      paddingTop: 100,
      paddingBottom: 60,
      paddingHorizontal: 80,
      zIndex: 10,
    },
    backTitle: {
      fontSize: 18,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 30,
    },
    backText: {
      fontSize: 12,
      color: textColor,
      textAlign: 'center',
      lineHeight: 1.6,
      maxWidth: 500,
      marginBottom: 30,
    },
    qrPlaceholder: {
      width: 80,
      height: 80,
      borderWidth: 2,
      borderColor: primaryColor,
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 15,
    },
    validationText: {
      fontSize: 10,
      color: `${textColor}80`,
    },
    validationUrl: {
      fontSize: 14,
      fontFamily: 'Montserrat',
      fontWeight: 700,
      color: primaryColor,
      marginTop: 5,
    },
    codeText: {
      fontSize: 12,
      color: secondaryColor,
      marginTop: 10,
    },
  });

  return (
    <Document>
      {/* Front Page */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Border frame */}
        <View style={styles.borderFrame} />

        {/* Left Badge */}
        <View style={[styles.badge, { left: 40 }]}>
          {config.left_badge_url ? (
            <Image src={config.left_badge_url} style={{ width: 50, height: 50 }} />
          ) : (
            <View style={[styles.badgeCircle, { borderWidth: 2, borderColor: secondaryColor, backgroundColor: primaryColor }]}>
              <Text style={{ fontSize: 20, color: secondaryColor }}>★</Text>
            </View>
          )}
          <Text style={styles.badgeText}>{config.left_badge_text || 'PREMIUM'}</Text>
        </View>

        {/* Right Badge */}
        <View style={[styles.badge, { right: 40 }]}>
          {config.right_badge_url ? (
            <Image src={config.right_badge_url} style={{ width: 50, height: 50 }} />
          ) : (
            <View style={[styles.badgeCircle, { backgroundColor: secondaryColor }]}>
              <Text style={{ fontSize: 20, color: 'white' }}>★</Text>
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
        {showFrontWaves && (
          <Svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: waveHeight }}>
            <Path
              d={getWavePath(frontWaveStyle, 'bottom', pageWidth, waveHeight)}
              fill={primaryColor}
            />
            <Path
              d={getAccentPath(frontWaveStyle, 'bottom', pageWidth, waveHeight)}
              fill="none"
              stroke={secondaryColor}
              strokeWidth={2}
            />
          </Svg>
        )}
      </Page>

      {/* Back Page */}
      {config.show_back_side !== false && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          {/* Border frame */}
          <View style={styles.borderFrame} />

          {/* Top Waves */}
          {showBackWaves && (
            <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, height: waveHeight * 0.7 }}>
              <Path
                d={getWavePath(backWaveStyle, 'top', pageWidth, waveHeight * 0.7)}
                fill={primaryColor}
              />
              <Path
                d={getAccentPath(backWaveStyle, 'top', pageWidth, waveHeight * 0.7)}
                fill="none"
                stroke={secondaryColor}
                strokeWidth={2}
              />
            </Svg>
          )}

          {/* Content */}
          <View style={styles.backContent}>
            {config.institution_logo_url && (
              <Image src={config.institution_logo_url} style={{ width: 50, height: 50, marginBottom: 20 }} />
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
                  <Text style={{ fontSize: 8, color: primaryColor }}>QR Code</Text>
                </View>
                <Text style={{ fontSize: 8, color: `${textColor}80` }}>Escaneie para validar</Text>
              </>
            )}

            <Text style={[styles.validationText, { marginTop: 20 }]}>
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
