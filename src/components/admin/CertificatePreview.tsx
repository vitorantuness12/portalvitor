import { motion } from 'framer-motion';
import { Eye, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

interface CertificatePreviewProps {
  config: CertificateConfigData;
}

export function CertificatePreview({ config }: CertificatePreviewProps) {
  const primaryColor = config.primary_color || '#3B82F6';
  const secondaryColor = config.secondary_color || '#7C3AED';
  const textColor = config.text_color || '#1F2937';
  const backgroundColor = config.background_color || '#FFFFFF';
  const showGradient = config.accent_gradient ?? true;

  const getBorderStyles = () => {
    switch (config.border_style) {
      case 'simple':
        return { outer: '2px solid', inner: 'none' };
      case 'ornate':
        return { outer: '4px double', inner: '2px solid' };
      case 'modern':
        return { outer: '3px solid', inner: '1px dashed' };
      case 'none':
        return { outer: 'none', inner: 'none' };
      case 'elegant':
      default:
        return { outer: '3px solid', inner: '1px solid' };
    }
  };

  const borderStyles = getBorderStyles();

  // Sample data for preview
  const sampleData = {
    studentName: 'João da Silva',
    courseName: 'Desenvolvimento Web Completo',
    duration: 40,
    date: new Date().toLocaleDateString('pt-BR'),
    score: 9.5,
    code: 'ABC1-DEF2-GHI3',
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="aspect-[1.414/1] rounded-lg overflow-hidden shadow-lg"
            style={{ backgroundColor }}
          >
            <div
              className="w-full h-full p-3"
              style={{
                border: borderStyles.outer,
                borderColor: primaryColor,
              }}
            >
              <div
                className="w-full h-full p-3 flex flex-col items-center justify-between"
                style={{
                  border: borderStyles.inner,
                  borderColor: `${primaryColor}40`,
                }}
              >
                {/* Header */}
                <div className="text-center">
                  {config.institution_logo_url && (
                    <img
                      src={config.institution_logo_url}
                      alt="Logo"
                      className="w-8 h-8 object-contain mx-auto mb-1"
                    />
                  )}
                  <p
                    className="text-[10px] font-bold"
                    style={{
                      color: showGradient ? primaryColor : primaryColor,
                      background: showGradient
                        ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                        : undefined,
                      WebkitBackgroundClip: showGradient ? 'text' : undefined,
                      WebkitTextFillColor: showGradient ? 'transparent' : undefined,
                    }}
                  >
                    {config.institution_name || 'Formar Ensino'}
                  </p>
                  <p
                    className="text-[7px] font-bold mt-0.5"
                    style={{ color: textColor }}
                  >
                    {config.front_title || 'CERTIFICADO DE CONCLUSÃO'}
                  </p>
                  <p className="text-[5px] text-gray-500">
                    {config.institution_subtitle || 'Curso Livre Online'}
                  </p>
                </div>

                {/* Body */}
                <div className="text-center flex-1 flex flex-col justify-center py-2">
                  <p className="text-[5px] text-gray-500 uppercase tracking-wider mb-1">
                    {config.front_subtitle || 'Certificamos que'}
                  </p>
                  <p
                    className="text-[9px] font-bold mb-1"
                    style={{ color: textColor }}
                  >
                    {sampleData.studentName}
                  </p>
                  <p className="text-[5px] text-gray-500">
                    {config.front_completion_text || 'concluiu com êxito o curso'}
                  </p>
                  <p
                    className="text-[7px] font-bold my-1"
                    style={{ color: primaryColor }}
                  >
                    {sampleData.courseName}
                  </p>

                  {/* Details */}
                  <div className="flex justify-center gap-3 mt-1">
                    <div className="text-center">
                      <p className="text-[4px] text-gray-400 uppercase">
                        {config.front_hours_text || 'Carga Horária'}
                      </p>
                      <p className="text-[5px] font-bold" style={{ color: textColor }}>
                        {sampleData.duration}h
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[4px] text-gray-400 uppercase">
                        {config.front_score_text || 'Nota'}
                      </p>
                      <p className="text-[5px] font-bold" style={{ color: textColor }}>
                        {sampleData.score}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[4px] text-gray-400 uppercase">
                        {config.front_date_text || 'Data'}
                      </p>
                      <p className="text-[5px] font-bold" style={{ color: textColor }}>
                        {sampleData.date}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="text-center">
                  {config.signature_image_url && (
                    <img
                      src={config.signature_image_url}
                      alt="Assinatura"
                      className="w-12 h-4 object-contain mx-auto mb-0.5"
                    />
                  )}
                  <div
                    className="border-t pt-0.5 px-4"
                    style={{ borderColor: '#CBD5E1' }}
                  >
                    <p className="text-[5px] font-bold" style={{ color: textColor }}>
                      {config.signature_name || 'Diretor(a) Acadêmico(a)'}
                    </p>
                    <p className="text-[4px] text-gray-500">
                      {config.signature_title || config.institution_name || 'Formar Ensino'}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-1 pt-1 border-t w-full" style={{ borderColor: '#E2E8F0' }}>
                  <p className="text-[4px] text-gray-400">
                    Código: {sampleData.code}
                  </p>
                  <p className="text-[3px] text-gray-400">
                    {config.back_validation_text || 'Valide em:'} {config.back_validation_url || 'formarensino.com.br/validar'}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="aspect-[1.414/1] rounded-lg overflow-hidden shadow-lg"
              style={{ backgroundColor }}
            >
              <div
                className="w-full h-full p-3"
                style={{
                  border: borderStyles.outer,
                  borderColor: primaryColor,
                }}
              >
                <div
                  className="w-full h-full p-3 flex flex-col items-center justify-center"
                  style={{
                    border: borderStyles.inner,
                    borderColor: `${primaryColor}40`,
                  }}
                >
                  {/* Back Header */}
                  <div className="text-center mb-2">
                    {config.institution_logo_url && (
                      <img
                        src={config.institution_logo_url}
                        alt="Logo"
                        className="w-6 h-6 object-contain mx-auto mb-1"
                      />
                    )}
                    <p
                      className="text-[7px] font-bold"
                      style={{ color: textColor }}
                    >
                      {config.back_title || 'INFORMAÇÕES DO CERTIFICADO'}
                    </p>
                  </div>

                  {/* Back Content */}
                  <div className="text-center max-w-[90%]">
                    <p className="text-[5px] text-gray-600 leading-relaxed">
                      {config.back_content ||
                        'Este certificado é válido em todo território nacional como curso livre, conforme a Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04.'}
                    </p>
                  </div>

                  {/* QR Code Placeholder */}
                  {config.show_qr_code !== false && (
                    <div className="mt-3">
                      <div
                        className="w-10 h-10 border-2 rounded flex items-center justify-center"
                        style={{ borderColor: primaryColor }}
                      >
                        <div className="grid grid-cols-4 gap-0.5">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5"
                              style={{
                                backgroundColor:
                                  Math.random() > 0.4 ? primaryColor : 'transparent',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[4px] text-gray-400 mt-1 text-center">
                        Escaneie para validar
                      </p>
                    </div>
                  )}

                  {/* Validation Info */}
                  <div className="mt-3 text-center">
                    <p className="text-[4px] text-gray-400">
                      {config.back_validation_text || 'Para validar este certificado, acesse:'}
                    </p>
                    <p
                      className="text-[5px] font-medium"
                      style={{ color: primaryColor }}
                    >
                      {config.back_validation_url || 'formarensino.com.br/validar'}
                    </p>
                    <p className="text-[4px] text-gray-400 mt-1">
                      Código: {sampleData.code}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          * Preview ilustrativo. O certificado final será gerado em PDF A4 paisagem.
        </p>
      </CardContent>
    </Card>
  );
}
