import { useState, useEffect, useRef } from 'react';
import { Check, Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

// Fontes cursivas para assinatura - usando Google Fonts
const signatureFonts = [
  { 
    id: 'dancing-script', 
    name: 'Dancing Script', 
    family: "'Dancing Script', cursive",
    googleFont: 'Dancing+Script:wght@700'
  },
  { 
    id: 'great-vibes', 
    name: 'Great Vibes', 
    family: "'Great Vibes', cursive",
    googleFont: 'Great+Vibes'
  },
  { 
    id: 'alex-brush', 
    name: 'Alex Brush', 
    family: "'Alex Brush', cursive",
    googleFont: 'Alex+Brush'
  },
  { 
    id: 'parisienne', 
    name: 'Parisienne', 
    family: "'Parisienne', cursive",
    googleFont: 'Parisienne'
  },
  { 
    id: 'sacramento', 
    name: 'Sacramento', 
    family: "'Sacramento', cursive",
    googleFont: 'Sacramento'
  },
  { 
    id: 'allura', 
    name: 'Allura', 
    family: "'Allura', cursive",
    googleFont: 'Allura'
  },
];

interface DigitalSignatureGeneratorProps {
  name: string;
  onGenerate: (dataUrl: string) => void;
  currentSignatureUrl?: string | null;
}

export function DigitalSignatureGenerator({ 
  name, 
  onGenerate,
  currentSignatureUrl 
}: DigitalSignatureGeneratorProps) {
  const [selectedFont, setSelectedFont] = useState(signatureFonts[0].id);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carregar fontes do Google
  useEffect(() => {
    const fontUrls = signatureFonts.map(f => f.googleFont).join('&family=');
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontUrls}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Aguardar carregamento das fontes
    link.onload = () => {
      setTimeout(() => setFontsLoaded(true), 500);
    };

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const selectedFontData = signatureFonts.find(f => f.id === selectedFont) || signatureFonts[0];

  const generateSignature = async () => {
    if (!name.trim() || !canvasRef.current) return;

    setGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Configurar canvas com alta resolução
      const scale = 3; // Para melhor qualidade
      canvas.width = 400 * scale;
      canvas.height = 120 * scale;
      
      // Limpar canvas (transparente)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Configurar fonte
      ctx.scale(scale, scale);
      ctx.font = `48px ${selectedFontData.family}`;
      ctx.fillStyle = '#1a1a2e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Desenhar o nome
      ctx.fillText(name, 200, 60);
      
      // Converter para data URL
      const dataUrl = canvas.toDataURL('image/png');
      onGenerate(dataUrl);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <Label className="font-medium">Gerar Assinatura Digital</Label>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Crie uma assinatura estilizada automaticamente a partir do nome do signatário
      </p>

      {!name?.trim() ? (
        <div className="text-sm text-amber-600 bg-amber-500/10 p-3 rounded-md">
          Digite o nome do signatário acima para gerar a assinatura digital
        </div>
      ) : (
        <>
          {/* Seleção de Fonte */}
          <div className="space-y-3">
            <Label className="text-sm">Escolha o estilo da fonte:</Label>
            <RadioGroup 
              value={selectedFont} 
              onValueChange={setSelectedFont}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {signatureFonts.map((font) => (
                <div key={font.id}>
                  <RadioGroupItem
                    value={font.id}
                    id={font.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={font.id}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 cursor-pointer transition-all hover:border-primary/50",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    )}
                  >
                    <span 
                      className="text-xl truncate max-w-full"
                      style={{ 
                        fontFamily: fontsLoaded ? font.family : 'cursive',
                        opacity: fontsLoaded ? 1 : 0.5
                      }}
                    >
                      {name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{font.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Preview da Assinatura */}
          <div className="space-y-2">
            <Label className="text-sm">Preview:</Label>
            <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-background overflow-hidden">
              <span 
                className="text-3xl sm:text-4xl text-foreground px-4 text-center"
                style={{ 
                  fontFamily: fontsLoaded ? selectedFontData.family : 'cursive',
                  opacity: fontsLoaded ? 1 : 0.5
                }}
              >
                {name}
              </span>
            </div>
          </div>

          {/* Canvas oculto para geração */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Botão de Gerar */}
          <Button 
            onClick={generateSignature}
            disabled={!fontsLoaded || generating}
            className="w-full"
            variant="outline"
          >
            {generating ? (
              <>Gerando...</>
            ) : (
              <>
                <Type className="h-4 w-4 mr-2" />
                Usar Esta Assinatura
              </>
            )}
          </Button>

          {currentSignatureUrl && (
            <p className="text-xs text-muted-foreground text-center">
              <Check className="h-3 w-3 inline mr-1" />
              Assinatura digital aplicada
            </p>
          )}
        </>
      )}
    </div>
  );
}
