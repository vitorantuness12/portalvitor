import { motion } from 'framer-motion';
import { Eye, Award, Star, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CertificatePreviewPdf } from './CertificatePreviewPdf';

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

interface CertificatePreviewProps {
  config: CertificateConfigData;
}

// Wave style components
const WaveStyles = {
  curves: (primaryColor: string, secondaryColor: string, position: 'bottom' | 'top') => {
    if (position === 'bottom') {
      return (
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-[40%]" 
          viewBox="0 0 400 160" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,80 Q100,40 200,80 T400,80 L400,160 L0,160 Z"
            fill={primaryColor}
          />
          <path
            d="M0,85 Q100,50 200,85 T400,85"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
          />
          <path
            d="M0,100 Q150,70 300,100 T400,90 L400,160 L0,160 Z"
            fill={primaryColor}
            opacity="0.8"
          />
        </svg>
      );
    }
    return (
      <svg 
        className="absolute top-0 left-0 right-0 w-full h-[25%]" 
        viewBox="0 0 400 100" 
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 L400,0 L400,60 Q300,90 200,60 T0,60 Z"
          fill={primaryColor}
        />
        <path
          d="M0,65 Q100,95 200,65 T400,65"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2"
        />
      </svg>
    );
  },
  
  geometric: (primaryColor: string, secondaryColor: string, position: 'bottom' | 'top') => {
    if (position === 'bottom') {
      return (
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-[40%]" 
          viewBox="0 0 400 160" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,100 L80,60 L160,90 L240,50 L320,80 L400,40 L400,160 L0,160 Z"
            fill={primaryColor}
          />
          <path
            d="M0,105 L80,65 L160,95 L240,55 L320,85 L400,45"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
          />
          <path
            d="M0,120 L100,90 L200,110 L300,80 L400,100 L400,160 L0,160 Z"
            fill={primaryColor}
            opacity="0.8"
          />
        </svg>
      );
    }
    return (
      <svg 
        className="absolute top-0 left-0 right-0 w-full h-[25%]" 
        viewBox="0 0 400 100" 
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 L400,0 L400,50 L320,70 L240,40 L160,60 L80,30 L0,50 Z"
          fill={primaryColor}
        />
        <path
          d="M0,55 L80,35 L160,65 L240,45 L320,75 L400,55"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2"
        />
      </svg>
    );
  },
  
  lines: (primaryColor: string, secondaryColor: string, position: 'bottom' | 'top') => {
    if (position === 'bottom') {
      return (
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-[40%]" 
          viewBox="0 0 400 160" 
          preserveAspectRatio="none"
        >
          <rect x="0" y="80" width="400" height="80" fill={primaryColor} />
          <line x1="0" y1="80" x2="400" y2="80" stroke={secondaryColor} strokeWidth="3" />
          <line x1="0" y1="90" x2="400" y2="90" stroke={secondaryColor} strokeWidth="1" opacity="0.5" />
          <line x1="0" y1="100" x2="400" y2="100" stroke={secondaryColor} strokeWidth="1" opacity="0.3" />
          {/* Diagonal accent lines */}
          {[0, 50, 100, 150, 200, 250, 300, 350].map((x) => (
            <line 
              key={x}
              x1={x} y1="160" x2={x + 40} y2="80" 
              stroke={secondaryColor} 
              strokeWidth="0.5" 
              opacity="0.2"
            />
          ))}
        </svg>
      );
    }
    return (
      <svg 
        className="absolute top-0 left-0 right-0 w-full h-[25%]" 
        viewBox="0 0 400 100" 
        preserveAspectRatio="none"
      >
        <rect x="0" y="0" width="400" height="60" fill={primaryColor} />
        <line x1="0" y1="60" x2="400" y2="60" stroke={secondaryColor} strokeWidth="3" />
        <line x1="0" y1="50" x2="400" y2="50" stroke={secondaryColor} strokeWidth="1" opacity="0.5" />
        <line x1="0" y1="40" x2="400" y2="40" stroke={secondaryColor} strokeWidth="1" opacity="0.3" />
        {[0, 50, 100, 150, 200, 250, 300, 350].map((x) => (
          <line 
            key={x}
            x1={x} y1="0" x2={x + 40} y2="60" 
            stroke={secondaryColor} 
            strokeWidth="0.5" 
            opacity="0.2"
          />
        ))}
      </svg>
    );
  },
  
  diagonal: (primaryColor: string, secondaryColor: string, position: 'bottom' | 'top') => {
    if (position === 'bottom') {
      return (
        <svg 
          className="absolute bottom-0 left-0 right-0 w-full h-[40%]" 
          viewBox="0 0 400 160" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,120 L400,60 L400,160 L0,160 Z"
            fill={primaryColor}
          />
          <path
            d="M0,110 L400,50"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
          />
          <path
            d="M0,140 L400,80 L400,160 L0,160 Z"
            fill={primaryColor}
            opacity="0.8"
          />
        </svg>
      );
    }
    return (
      <svg 
        className="absolute top-0 left-0 right-0 w-full h-[25%]" 
        viewBox="0 0 400 100" 
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 L400,0 L400,40 L0,80 Z"
          fill={primaryColor}
        />
        <path
          d="M0,85 L400,45"
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2"
        />
      </svg>
    );
  },
};

export function CertificatePreview({ config }: CertificatePreviewProps) {
  const primaryColor = config.primary_color || '#1E3A5F';
  const secondaryColor = config.secondary_color || '#D4AF37';
  const textColor = config.text_color || '#1E3A5F';
  const backgroundColor = config.background_color || '#FFFFFF';
  const frontWaveStyle = (config.front_wave_style || 'curves') as keyof typeof WaveStyles;
  const backWaveStyle = (config.back_wave_style || 'curves') as keyof typeof WaveStyles;
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

  const renderWave = (style: keyof typeof WaveStyles, position: 'bottom' | 'top') => {
    const waveRenderer = WaveStyles[style] || WaveStyles.curves;
    return waveRenderer(primaryColor, secondaryColor, position);
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Front Side Preview */}
        <div className="relative">
          <p className="text-xs text-muted-foreground mb-2 text-center">Frente</p>
          <motion.div
            key={`${primaryColor}-${secondaryColor}-${backgroundColor}-${frontWaveStyle}-${showFrontWaves}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="aspect-[1.414/1] rounded-lg overflow-hidden shadow-xl relative"
            style={{ backgroundColor }}
          >
            {/* Gold outer border */}
            <div 
              className="absolute inset-2 rounded pointer-events-none"
              style={{ 
                border: `2px solid ${secondaryColor}`,
              }}
            />
            
            {/* Decorative wave at bottom */}
            {showFrontWaves && renderWave(frontWaveStyle, 'bottom')}

            {/* Left Badge */}
            <div className="absolute top-4 left-4 z-20">
              {config.left_badge_url ? (
                <img 
                  src={config.left_badge_url} 
                  alt="Badge" 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                  style={{ 
                    borderColor: secondaryColor,
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                  }}
                >
                  <Award className="w-4 h-4" style={{ color: secondaryColor }} />
                </div>
              )}
              <p 
                className="text-[4px] text-center mt-0.5 font-bold uppercase"
                style={{ color: primaryColor }}
              >
                {config.left_badge_text || 'PREMIUM'}
              </p>
            </div>

            {/* Right Badge */}
            <div className="absolute top-4 right-4 z-20">
              {config.right_badge_url ? (
                <img 
                  src={config.right_badge_url} 
                  alt="Badge" 
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${secondaryColor}, ${secondaryColor}cc)`,
                    boxShadow: `0 2px 8px ${secondaryColor}40`,
                  }}
                >
                  <Star className="w-4 h-4 text-white fill-white" />
                </div>
              )}
              <p 
                className="text-[4px] text-center mt-0.5 font-bold uppercase"
                style={{ color: primaryColor }}
              >
                {config.right_badge_text || 'QUALIDADE'}
              </p>
            </div>

            {/* Main Content */}
            <div className="relative z-10 h-full flex flex-col items-center pt-6 pb-16 px-6">
              {/* Header */}
              <div className="text-center mb-2">
                {config.institution_logo_url && (
                  <img
                    src={config.institution_logo_url}
                    alt="Logo"
                    className="w-10 h-10 object-contain mx-auto mb-1"
                  />
                )}
                
                {/* Title */}
                <div className="mb-2">
                  <p
                    className="text-[12px] font-bold tracking-[0.2em] uppercase"
                    style={{ color: primaryColor }}
                  >
                    {(config.front_title || 'CERTIFICADO').split(' ')[0]}
                  </p>
                  <p
                    className="text-[6px] tracking-[0.15em] uppercase -mt-0.5"
                    style={{ color: textColor }}
                  >
                    {(config.front_title || 'CERTIFICADO DE CONCLUSÃO').split(' ').slice(1).join(' ') || 'DE CONCLUSÃO'}
                  </p>
                </div>
                
                {/* Subtitle */}
                <p 
                  className="text-[5px] uppercase tracking-wider"
                  style={{ color: `${textColor}99` }}
                >
                  {config.front_subtitle || 'Este certificado é orgulhosamente concedido a'}
                </p>
              </div>

              {/* Student Name */}
              <div className="text-center my-2 flex-1 flex flex-col justify-center">
                <p
                  className="text-[14px] font-bold italic"
                  style={{ 
                    color: secondaryColor,
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  {sampleData.studentName}
                </p>
                
                {/* Decorative line */}
                <div className="flex items-center justify-center gap-2 my-1">
                  <div className="w-8 h-[1px]" style={{ backgroundColor: secondaryColor }} />
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  <div className="w-8 h-[1px]" style={{ backgroundColor: secondaryColor }} />
                </div>

                {/* Course info */}
                <p 
                  className="text-[5px] mb-1"
                  style={{ color: `${textColor}80` }}
                >
                  {config.front_completion_text || 'pela conclusão com êxito do curso'}
                </p>
                <p
                  className="text-[7px] font-bold"
                  style={{ color: primaryColor }}
                >
                  {sampleData.courseName}
                </p>

                {/* Description text */}
                <p 
                  className="text-[4px] mt-1 max-w-[80%] mx-auto leading-relaxed"
                  style={{ color: `${textColor}60` }}
                >
                  {config.institution_subtitle || 'Certificado emitido após conclusão de todas as atividades e aprovação na avaliação final.'}
                </p>
              </div>

              {/* Footer with signature and date */}
              <div className="flex justify-between items-end w-full px-4 relative z-20">
                <div className="text-center">
                  <div 
                    className="w-12 border-t mb-0.5"
                    style={{ borderColor: textColor }}
                  />
                  <p className="text-[5px]" style={{ color: textColor }}>
                    {config.front_date_text || 'Data'}
                  </p>
                </div>

                <div className="text-center">
                  {config.signature_image_url && (
                    <img
                      src={config.signature_image_url}
                      alt="Assinatura"
                      className="w-14 h-5 object-contain mx-auto mb-0.5"
                    />
                  )}
                  <div 
                    className="w-16 border-t mb-0.5"
                    style={{ borderColor: textColor }}
                  />
                  <p className="text-[5px]" style={{ color: textColor }}>
                    {config.signature_name || 'Assinatura'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Back Side Preview */}
        {config.show_back_side !== false && (
          <div className="relative">
            <p className="text-xs text-muted-foreground mb-2 text-center">Verso</p>
            <motion.div
              key={`back-${primaryColor}-${secondaryColor}-${backWaveStyle}-${showBackWaves}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="aspect-[1.414/1] rounded-lg overflow-hidden shadow-xl relative"
              style={{ backgroundColor }}
            >
              {/* Gold border */}
              <div 
                className="absolute inset-2 rounded pointer-events-none"
                style={{ border: `2px solid ${secondaryColor}` }}
              />

              {/* Decorative top wave */}
              {showBackWaves && renderWave(backWaveStyle, 'top')}

              {/* Main Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 py-8">
                {/* Logo */}
                {config.institution_logo_url && (
                  <img
                    src={config.institution_logo_url}
                    alt="Logo"
                    className="w-8 h-8 object-contain mb-2"
                  />
                )}

                {/* Title */}
                <p
                  className="text-[8px] font-bold tracking-wider uppercase mb-3"
                  style={{ color: primaryColor }}
                >
                  {config.back_title || 'INFORMAÇÕES DO CERTIFICADO'}
                </p>

                {/* Content */}
                <div 
                  className="text-center max-w-[85%] mb-4"
                  style={{ color: textColor }}
                >
                  <p className="text-[5px] leading-relaxed">
                    {config.back_content || 'Este certificado é válido em todo território nacional como curso livre, conforme a Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04.'}
                  </p>
                </div>

                {/* QR Code Placeholder */}
                {config.show_qr_code !== false && (
                  <div className="mb-3">
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center"
                      style={{ 
                        backgroundColor: 'white',
                        border: `2px solid ${primaryColor}`,
                      }}
                    >
                      <div className="grid grid-cols-5 gap-0.5 p-1">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5"
                            style={{
                              backgroundColor: [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].includes(i) 
                                ? primaryColor 
                                : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p 
                      className="text-[4px] text-center mt-1"
                      style={{ color: `${textColor}80` }}
                    >
                      Escaneie para validar
                    </p>
                  </div>
                )}

                {/* Validation Info */}
                <div className="text-center">
                  <p 
                    className="text-[4px]"
                    style={{ color: `${textColor}80` }}
                  >
                    {config.back_validation_text || 'Para validar este certificado, acesse:'}
                  </p>
                  <p
                    className="text-[6px] font-bold"
                    style={{ color: primaryColor }}
                  >
                    {config.back_validation_url || 'formak.com.br/validar'}
                  </p>
                  <p 
                    className="text-[5px] mt-1"
                    style={{ color: secondaryColor }}
                  >
                    Código: {sampleData.code}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Download PDF Button */}
        <PDFDownloadLink
          document={<CertificatePreviewPdf config={config} />}
          fileName="preview-certificado.pdf"
          className="w-full"
        >
          {({ loading }) => (
            <Button 
              variant="outline" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Preview em PDF
                </>
              )}
            </Button>
          )}
        </PDFDownloadLink>

        <p className="text-[10px] text-muted-foreground text-center">
          * Preview ilustrativo. O certificado final será gerado em PDF A4 paisagem.
        </p>
      </CardContent>
    </Card>
  );
}
