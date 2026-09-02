import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, X, Loader2, Sparkles } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;

interface EditCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
}

export function EditCourseModal({ open, onOpenChange, course }: EditCourseModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: course.title,
    short_description: course.short_description || '',
    description: course.description,
    level: course.level,
    duration_hours: course.duration_hours,
    price: course.price,
    category_id: course.category_id || '',
    status: course.status,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course.thumbnail_url);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCover = async () => {
    const title = formData.title.trim();
    if (!title) {
      toast.error('Informe o título do curso antes de gerar a capa');
      return;
    }

    setIsGenerating(true);
    try {
      const theme =
        categories?.find((c) => c.id === formData.category_id)?.name || title;

      const { data, error } = await supabase.functions.invoke('generate-course-cover', {
        body: { title, theme },
      });

      if (error) throw error;
      if (!data?.success || !data?.image) {
        throw new Error(data?.error || 'Não foi possível gerar a capa');
      }

      const binary = atob(data.image as string);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], `capa-ia-${Date.now()}.png`, { type: 'image/png' });

      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      toast.success('Capa gerada! Salve as alterações para aplicar.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao gerar capa: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { thumbnail_url?: string }) => {
      const { error } = await supabase
        .from('courses')
        .update({
          ...data,
          category_id: data.category_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', course.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Curso atualizado com sucesso');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar curso');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    let thumbnail_url = course.thumbnail_url;

    if (thumbnailFile) {
      setIsUploading(true);
      try {
        const fileExt = (thumbnailFile.name.split('.').pop() || 'jpg').toLowerCase();
        const fileName = `${course.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('course-thumbnails')
          .upload(fileName, thumbnailFile, {
            upsert: true,
            contentType: thumbnailFile.type,
          });

        if (uploadError) throw uploadError;

        // O bucket é privado (buckets públicos estão bloqueados nesta workspace),
        // então geramos uma URL assinada de longa duração (10 anos).
        const { data: signed, error: signError } = await supabase.storage
          .from('course-thumbnails')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);

        if (signError || !signed?.signedUrl) throw signError ?? new Error('Falha ao gerar URL da imagem');

        thumbnail_url = signed.signedUrl;
      } catch (error) {
        console.error('Erro no upload da capa:', error);
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        toast.error(`Erro ao fazer upload da imagem: ${message}`);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    } else if (thumbnailPreview === null) {
      thumbnail_url = null;
    }

    updateMutation.mutate({ ...formData, thumbnail_url });
  };

  const isLoading = updateMutation.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Foto de Capa</Label>
            <div className="flex flex-col gap-4">
              {thumbnailPreview ? (
                <div className="relative w-full max-w-xs">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full aspect-video object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removeThumbnail}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
              <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xs aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para adicionar imagem
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tamanho ideal: 1280x720px (16:9)
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formato recomendado: JPG ou PNG. Tamanho ideal: 1280x720px (proporção 16:9). Máximo: 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                {thumbnailPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-fit"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Trocar imagem
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateCover}
                  disabled={isGenerating}
                  className="w-fit"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isGenerating ? 'Gerando capa...' : 'Gerar capa'}
                </Button>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nome do curso"
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="short_description">Subtítulo</Label>
            <Input
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Frase chamativa que complementa o título (ex: 'Do básico ao avançado')"
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 150 caracteres. Aparece abaixo do título nos cards.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Completa *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada do curso"
              rows={5}
            />
          </div>

          {/* Category and Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iniciante">Iniciante</SelectItem>
                  <SelectItem value="intermediario">Intermediário</SelectItem>
                  <SelectItem value="avancado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (horas)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
