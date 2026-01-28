import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PhotoUploadProps {
  photoUrl: string | null;
  onPhotoChange: (url: string | null) => void;
  userId: string;
  disabled?: boolean;
}

export function PhotoUpload({ photoUrl, onPhotoChange, userId, disabled }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, envie apenas imagens (JPG ou PNG)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/photo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('student-card-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('student-card-photos')
        .getPublicUrl(fileName);

      onPhotoChange(urlData.publicUrl);
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao enviar foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removePhoto = () => {
    onPhotoChange(null);
  };

  return (
    <div className="space-y-3">
      <div
        className={`
          relative rounded-lg border-2 border-dashed transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        <AspectRatio ratio={3 / 4} className="flex items-center justify-center">
          <AnimatePresence mode="wait">
            {photoUrl ? (
              <motion.div
                key="photo"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full h-full"
              >
                <img
                  src={photoUrl}
                  alt="Foto do estudante"
                  className="w-full h-full object-cover rounded-lg"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center p-6"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-3" />
                    <p className="text-sm text-muted-foreground">Enviando...</p>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-primary/10 rounded-full mb-3">
                      <Camera className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium text-sm">Foto 3x4</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique ou arraste uma imagem
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG • Máx 2MB
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </AspectRatio>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Use uma foto recente com fundo claro, sem óculos escuros ou chapéu
      </p>
    </div>
  );
}
