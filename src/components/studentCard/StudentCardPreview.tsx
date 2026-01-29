import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logo from '@/assets/logo_formak.png';

interface StudentCardPreviewProps {
  studentName: string;
  photoUrl: string | null;
  cardCode: string;
  issuedAt?: Date;
  expiresAt?: Date;
  validationUrl: string;
  side?: 'front' | 'back';
}

export function StudentCardPreview({
  studentName,
  photoUrl,
  cardCode,
  issuedAt,
  expiresAt,
  validationUrl,
  side = 'front',
}: StudentCardPreviewProps) {
  const displayDate = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-[340px] mx-auto"
    >
      {/* Card Container - Credit card aspect ratio */}
      <div className="aspect-[1.586/1] rounded-xl overflow-hidden shadow-xl bg-gradient-to-br from-primary via-primary to-primary/80 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {side === 'front' ? (
          /* Front Side */
          <div className="relative h-full p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="Logo" className="h-8 w-8 object-contain bg-white rounded-full p-0.5" />
              <div>
                <h3 className="text-white font-bold text-sm leading-tight">FORMAK</h3>
                <p className="text-white/70 text-[10px]">Carteirinha de Estudante</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-3 flex-1">
              {/* Photo */}
              <div className="w-20 h-24 rounded-lg overflow-hidden bg-white/20 flex-shrink-0 border-2 border-white/30">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={studentName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white/50 text-4xl">👤</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <p className="text-[10px] text-white/70 uppercase tracking-wide">Nome do Estudante</p>
                <p className="text-white font-bold text-sm truncate">{studentName || 'Nome do Aluno'}</p>
                
                <p className="text-[10px] text-white/70 uppercase tracking-wide mt-2">Código</p>
                <p className="text-white font-mono text-xs">{cardCode || 'CARD-XXXXXX'}</p>
                
                <p className="text-[10px] text-white/70 uppercase tracking-wide mt-2">Válido até</p>
                <p className="text-white font-semibold text-xs">
                  {format(displayDate, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
              <p className="text-[9px] text-white/60">www.formak.com.br</p>
              <div className="bg-white rounded p-1">
                <QRCodeSVG
                  value={validationUrl}
                  size={36}
                  level="L"
                  bgColor="white"
                  fgColor="#000"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Back Side */
          <div className="relative h-full p-4 flex flex-col bg-white">
            <div className="flex-1 flex flex-col">
              {/* Validation Info */}
              <div className="bg-primary rounded-lg p-3 mb-3">
                <p className="text-[10px] text-white/90 uppercase tracking-wide mb-1">Para validar esta carteirinha</p>
                <p className="text-white text-xs">Acesse: formak.com.br/validar-carteirinha</p>
                <p className="text-white font-mono text-sm mt-1">Código: {cardCode || 'CARD-XXXXXX'}</p>
              </div>

              {/* Terms */}
              <div className="flex-1">
                <p className="text-[8px] text-muted-foreground leading-relaxed">
                  Esta carteirinha é de uso pessoal e intransferível. O uso indevido está sujeito às penalidades previstas em lei. Em caso de perda ou roubo, comunique imediatamente através do nosso site.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-sm font-bold text-primary">Formak</p>
                <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
