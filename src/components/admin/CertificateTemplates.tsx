import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: {
    primary_color: string;
    secondary_color: string;
    text_color: string;
    background_color: string;
    accent_gradient: boolean;
    border_style: string;
  };
  config: {
    institution_name?: string;
    institution_subtitle?: string;
    front_title: string;
    front_subtitle: string;
    front_completion_text: string;
    front_hours_text: string;
    front_date_text: string;
    front_score_text: string;
    back_title: string;
    back_content: string;
    back_validation_text: string;
    primary_color: string;
    secondary_color: string;
    text_color: string;
    background_color: string;
    accent_gradient: boolean;
    border_style: string;
    show_qr_code: boolean;
    show_back_side: boolean;
  };
}

export const certificateTemplates: CertificateTemplate[] = [
  {
    id: 'modern',
    name: 'Moderno',
    description: 'Azul profundo com detalhes dourados vibrantes',
    icon: <Sparkles className="h-5 w-5" />,
    preview: {
      primary_color: '#1E3A5F',
      secondary_color: '#D4AF37',
      text_color: '#1E3A5F',
      background_color: '#FFFFFF',
      accent_gradient: true,
      border_style: 'modern',
    },
    config: {
      front_title: 'CERTIFICADO DE CONCLUSÃO',
      front_subtitle: 'Este certificado é orgulhosamente concedido a',
      front_completion_text: 'pela conclusão com êxito do curso',
      front_hours_text: 'Carga Horária',
      front_date_text: 'Data',
      front_score_text: 'Nota',
      back_title: 'INFORMAÇÕES DO CERTIFICADO',
      back_content: 'Este certificado é válido em todo território nacional como curso livre, conforme a Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04. O conteúdo programático e a carga horária estão de acordo com os padrões estabelecidos para educação continuada.',
      back_validation_text: 'Para validar este certificado, acesse:',
      primary_color: '#1E3A5F',
      secondary_color: '#D4AF37',
      text_color: '#1E3A5F',
      background_color: '#FFFFFF',
      accent_gradient: true,
      border_style: 'modern',
      show_qr_code: true,
      show_back_side: true,
    },
  },
  {
    id: 'classic',
    name: 'Clássico',
    description: 'Elegância tradicional com bordas ornamentadas douradas',
    icon: <Crown className="h-5 w-5" />,
    preview: {
      primary_color: '#0F2A4A',
      secondary_color: '#C9A227',
      text_color: '#0F2A4A',
      background_color: '#FFFEF7',
      accent_gradient: true,
      border_style: 'ornate',
    },
    config: {
      front_title: 'CERTIFICADO DE MÉRITO',
      front_subtitle: 'A presente instituição certifica que',
      front_completion_text: 'concluiu com distinção o curso de',
      front_hours_text: 'Carga Horária Total',
      front_date_text: 'Data de Conclusão',
      front_score_text: 'Aproveitamento',
      back_title: 'AUTENTICIDADE DO DOCUMENTO',
      back_content: 'Este documento possui validade em todo território nacional como certificado de curso livre, em conformidade com a Lei de Diretrizes e Bases da Educação Nacional (Lei nº 9.394/96) e regulamentado pelo Decreto Presidencial nº 5.154/04. A autenticidade pode ser verificada através do código único de validação.',
      back_validation_text: 'Verifique a autenticidade em:',
      primary_color: '#0F2A4A',
      secondary_color: '#C9A227',
      text_color: '#0F2A4A',
      background_color: '#FFFEF7',
      accent_gradient: true,
      border_style: 'ornate',
      show_qr_code: true,
      show_back_side: true,
    },
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Azul navy clean com toques sutis de ouro',
    icon: <Leaf className="h-5 w-5" />,
    preview: {
      primary_color: '#2C4A6E',
      secondary_color: '#B8963E',
      text_color: '#2C4A6E',
      background_color: '#FAFBFC',
      accent_gradient: false,
      border_style: 'simple',
    },
    config: {
      front_title: 'Certificado',
      front_subtitle: 'Certificamos que',
      front_completion_text: 'completou o curso',
      front_hours_text: 'Duração',
      front_date_text: 'Data',
      front_score_text: 'Nota',
      back_title: 'Validação',
      back_content: 'Certificado válido conforme Lei nº 9.394/96.',
      back_validation_text: 'Validar em:',
      primary_color: '#2C4A6E',
      secondary_color: '#B8963E',
      text_color: '#2C4A6E',
      background_color: '#FAFBFC',
      accent_gradient: false,
      border_style: 'simple',
      show_qr_code: false,
      show_back_side: false,
    },
  },
];

interface CertificateTemplatesProps {
  selectedTemplate?: string;
  onSelectTemplate: (template: CertificateTemplate) => void;
}

export function CertificateTemplates({ selectedTemplate, onSelectTemplate }: CertificateTemplatesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {certificateTemplates.map((template, index) => {
        const isSelected = selectedTemplate === template.id;
        const { preview } = template;
        
        return (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              <CardContent className="p-0">
                {/* Mini Preview with wave design */}
                <div 
                  className="aspect-[1.5/1] relative overflow-hidden"
                  style={{ backgroundColor: preview.background_color }}
                >
                  {/* Gold border */}
                  <div 
                    className="absolute inset-1.5 rounded-sm pointer-events-none"
                    style={{ border: `1px solid ${preview.secondary_color}` }}
                  />
                  
                  {/* Wave decoration at bottom */}
                  <svg 
                    className="absolute bottom-0 left-0 right-0 w-full h-[40%]" 
                    viewBox="0 0 100 40" 
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,20 Q25,10 50,20 T100,20 L100,40 L0,40 Z"
                      fill={preview.primary_color}
                    />
                    <path
                      d="M0,22 Q25,12 50,22 T100,22"
                      fill="none"
                      stroke={preview.secondary_color}
                      strokeWidth="0.5"
                    />
                  </svg>
                  
                  {/* Left badge placeholder */}
                  <div 
                    className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ 
                      border: `1px solid ${preview.secondary_color}`,
                      backgroundColor: preview.primary_color,
                    }}
                  />
                  
                  {/* Right badge placeholder */}
                  <div 
                    className="absolute top-2 right-2 w-4 h-4 rounded-full"
                    style={{ backgroundColor: preview.secondary_color }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 pb-8 pt-4">
                    {/* Title */}
                    <div 
                      className="w-12 h-1 rounded mb-0.5"
                      style={{ backgroundColor: preview.primary_color }}
                    />
                    <div 
                      className="w-8 h-0.5 rounded mb-2"
                      style={{ backgroundColor: `${preview.text_color}60` }}
                    />
                    
                    {/* Name - gold/secondary */}
                    <div 
                      className="w-16 h-1.5 rounded mb-1"
                      style={{ backgroundColor: preview.secondary_color }}
                    />
                    
                    {/* Decorative line */}
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-4 h-[1px]" style={{ backgroundColor: preview.secondary_color }} />
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: preview.secondary_color }} />
                      <div className="w-4 h-[1px]" style={{ backgroundColor: preview.secondary_color }} />
                    </div>
                    
                    {/* Course */}
                    <div 
                      className="w-14 h-1 rounded"
                      style={{ backgroundColor: preview.primary_color }}
                    />
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="p-1.5 rounded-md"
                      style={{ 
                        background: preview.accent_gradient
                          ? `linear-gradient(135deg, ${preview.primary_color}20, ${preview.secondary_color}20)`
                          : `${preview.primary_color}20`,
                        color: preview.primary_color,
                      }}
                    >
                      {template.icon}
                    </span>
                    <h3 className="font-semibold">{template.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
