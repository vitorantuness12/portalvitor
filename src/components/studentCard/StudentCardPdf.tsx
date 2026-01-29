import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
  },
  cardContainer: {
    width: 324,
    height: 204,
    borderRadius: 12,
    overflow: 'hidden',
    margin: '0 auto',
  },
  frontCard: {
    width: '100%',
    height: '100%',
    padding: 16,
    backgroundColor: '#FF7026',
    position: 'relative',
  },
  backCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoContainer: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
  headerText: {
    flex: 1,
  },
  institutionName: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 7,
  },
  mainContent: {
    flexDirection: 'row',
    flex: 1,
  },
  photo: {
    width: 64,
    height: 80,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: 64,
    height: 80,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  codeValue: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Courier',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
    marginTop: 'auto',
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 6,
  },
  qrCode: {
    width: 36,
    height: 36,
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 4,
  },
  // Back card styles
  backContent: {
    flex: 1,
  },
  validationBox: {
    backgroundColor: '#FF7026',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  validationLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  validationText: {
    color: 'white',
    fontSize: 8,
  },
  validationCode: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: 'bold',
    marginTop: 4,
  },
  terms: {
    color: '#666666',
    fontSize: 5,
    lineHeight: 1.4,
  },
  backFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
    marginTop: 'auto',
  },
  backFooterText: {
    color: '#FF7026',
    fontSize: 8,
    fontWeight: 'bold',
  },
  backLogo: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
  sectionTitle: {
    color: '#666',
    fontSize: 10,
    marginBottom: 10,
    marginTop: 20,
  },
});

interface StudentCardPdfProps {
  studentName: string;
  photoUrl: string | null;
  cardCode: string;
  expiresAt: string;
  validationUrl: string;
  qrCodeDataUrl: string;
  logoUrl?: string;
}

export function StudentCardPdf({
  studentName,
  photoUrl,
  cardCode,
  expiresAt,
  validationUrl,
  qrCodeDataUrl,
  logoUrl,
}: StudentCardPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
          Carteirinha de Estudante
        </Text>

        {/* Front Card */}
        <Text style={styles.sectionTitle}>Frente</Text>
        <View style={styles.cardContainer}>
          <View style={styles.frontCard}>
            {/* Header */}
            <View style={styles.header}>
              {logoUrl && (
                <View style={styles.logoContainer}>
                  <Image src={logoUrl} style={styles.logo} />
                </View>
              )}
              <View style={styles.headerText}>
                <Text style={styles.institutionName}>FORMAK</Text>
                <Text style={styles.subtitle}>Carteirinha de Estudante</Text>
              </View>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
              {/* Photo */}
              {photoUrl ? (
                <Image src={photoUrl} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={{ color: 'white', fontSize: 24 }}>👤</Text>
                </View>
              )}

              {/* Info */}
              <View style={styles.infoSection}>
                <Text style={styles.label}>Nome do Estudante</Text>
                <Text style={styles.value}>{studentName}</Text>

                <Text style={styles.label}>Código</Text>
                <Text style={styles.codeValue}>{cardCode}</Text>

                <Text style={styles.label}>Válido até</Text>
                <Text style={styles.value}>{expiresAt}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>www.formak.com.br</Text>
              {qrCodeDataUrl && <Image src={qrCodeDataUrl} style={styles.qrCode} />}
            </View>
          </View>
        </View>

        {/* Back Card */}
        <Text style={styles.sectionTitle}>Verso</Text>
        <View style={styles.cardContainer}>
          <View style={styles.backCard}>
            {/* Content */}
            <View style={styles.backContent}>
              <View style={styles.validationBox}>
                <Text style={styles.validationLabel}>Para validar esta carteirinha</Text>
                <Text style={styles.validationText}>Acesse: formak.com.br/validar-carteirinha</Text>
                <Text style={styles.validationCode}>Código: {cardCode}</Text>
              </View>

              <Text style={styles.terms}>
                Esta carteirinha é de uso pessoal e intransferível. O uso indevido está sujeito às penalidades previstas em lei. Em caso de perda ou roubo, comunique imediatamente através do nosso site.
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.backFooter}>
              <Text style={styles.backFooterText}>Formak</Text>
              {logoUrl && <Image src={logoUrl} style={styles.backLogo} />}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Helper function to generate QR Code data URL
export async function generateQRCodeDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}
