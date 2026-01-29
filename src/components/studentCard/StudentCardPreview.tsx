import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoWhite from '@/assets/logo_formak_white.png';
import logo from '@/assets/logo_formak.png';

interface StudentCardPreviewProps {
  studentName: string;
  photoUrl: string | null;
  cardCode: string;
  issuedAt?: Date;
  expiresAt?: Date;
  validationUrl: string;
  side?: 'front' | 'back';
  exportMode?: boolean;
}

export function StudentCardPreview({
  studentName,
  photoUrl,
  cardCode,
  issuedAt,
  expiresAt,
  validationUrl,
  side = 'front',
  exportMode = false,
}: StudentCardPreviewProps) {
  const displayDate = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const wrapperClassName = exportMode
    ? 'relative w-[340px]'
    : 'relative w-full max-w-[340px] mx-auto';

  const cardClassName = exportMode
    ? 'aspect-[1.586/1] rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 relative font-sans'
    : 'aspect-[1.586/1] rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-primary via-primary to-primary/80 relative font-sans';

  const Wrapper: any = exportMode ? 'div' : motion.div;
  const wrapperProps = exportMode
    ? { className: wrapperClassName }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        className: wrapperClassName,
      };

  // Style for name - simple approach compatible with html2canvas
  const nameStyle: React.CSSProperties = {
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: '1.2',
  };

  return (
    <Wrapper {...wrapperProps}>
      {/* Card Container - Credit card aspect ratio */}
      <div className={cardClassName} style={{ fontFamily: 'Arial, sans-serif' }}>

        {side === 'front' ? (
          /* Front Side */
          <div className="relative h-full p-3 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col items-start">
                <img src={logoWhite} alt="Formak" className="h-4 object-contain" />
                <p className="text-white/90 text-[8px] mt-0.5 font-sans">Carteirinha de Estudante</p>
              </div>
              <span className="text-white font-bold text-base leading-none">{new Date().getFullYear()}</span>
            </div>

            {/* Main Content */}
            <div className="flex gap-3 flex-1">
              {/* Photo */}
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-white/20 flex-shrink-0 border-2 border-white/30">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/50 text-2xl">👤</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-[8px] text-white/70 uppercase tracking-wide">Nome do Estudante</p>
                <p 
                  className="text-white font-bold text-[12px]"
                  style={nameStyle}
                >
                  {studentName || 'Nome do Aluno'}
                </p>
                
                <p className="text-[8px] text-white/70 uppercase tracking-wide mt-1">Código</p>
                <p className="text-white font-bold font-sans text-[10px] tracking-wide">{cardCode || 'CARD-XXXXXX'}</p>
                
                <p className="text-[8px] text-white/70 uppercase tracking-wide mt-1">Válido até</p>
                <p className="text-white font-bold text-[10px]">
                  {format(displayDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-white/20">
              <p className="text-[7px] text-white/60">www.formak.com.br</p>
              <div className="bg-white rounded p-0.5">
                <QRCodeSVG
                  value={validationUrl}
                  size={22}
                  level="L"
                  bgColor="white"
                  fgColor="#000"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Back Side */
          <div className="relative h-full p-3 flex flex-col bg-white">
            <div className="flex-1 flex flex-col">
              {/* Validation Info */}
              <div className="bg-primary rounded-lg p-2 mb-2">
                <p className="text-[8px] text-white/90 uppercase tracking-wide mb-0.5">Para validar esta carteirinha</p>
                <p className="text-white text-[10px]">Acesse: formak.com.br/validar-carteirinha</p>
                <p className="text-white font-bold font-sans text-[11px] mt-0.5 tracking-wide">Código: {cardCode || 'CARD-XXXXXX'}</p>
              </div>

              {/* Terms */}
              <div className="flex-1">
                <p className="text-[7px] text-muted-foreground leading-relaxed">
                  Esta carteirinha é de uso pessoal e intransferível. O uso indevido está sujeito às penalidades previstas em lei. Em caso de perda ou roubo, comunique imediatamente através do nosso site.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-border">
                <p className="text-sm font-bold text-primary">Formak</p>
                <img src={logo} alt="Logo" className="h-5 w-5 object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
