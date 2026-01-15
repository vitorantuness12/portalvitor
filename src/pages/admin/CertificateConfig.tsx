import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Save, 
  Upload, 
  Palette, 
  FileText, 
  Image, 
  Eye,
  RotateCcw,
  Settings2,
  Award,
  PenTool,
  PanelRightClose,
  PanelRightOpen,
  LayoutTemplate
} from 'lucide-react';
import { CertificatePreview } from '@/components/admin/CertificatePreview';
import { CertificateTemplates, certificateTemplates, CertificateTemplate } from '@/components/admin/CertificateTemplates';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CertificateConfigData {
  id: string;
  institution_name: string;
  institution_subtitle: string | null;
  institution_logo_url: string | null;
  front_title: string;
  front_subtitle: string | null;
  front_completion_text: string | null;
  front_hours_text: string | null;
  front_date_text: string | null;
  front_score_text: string | null;
  back_title: string | null;
  back_content: string | null;
  back_validation_text: string | null;
  back_validation_url: string | null;
  signature_name: string | null;
  signature_title: string | null;
  signature_image_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  text_color: string | null;
  background_color: string | null;
  accent_gradient: boolean | null;
  border_style: string | null;
  show_qr_code: boolean | null;
  show_back_side: boolean | null;
}

export default function CertificateConfig() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<'logo' | 'signature' | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>();

  const [config, setConfig] = useState<Partial<CertificateConfigData>>({});

  const { data: savedConfig, isLoading } = useQuery({
    queryKey: ['certificate-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_config')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return data as CertificateConfigData;
    },
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, [savedConfig]);

  const updateConfig = (field: keyof CertificateConfigData, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const applyTemplate = (template: CertificateTemplate) => {
    setSelectedTemplate(template.id);
    setConfig(prev => ({
      ...prev,
      ...template.config,
      // Preserve user's institution info and images
      institution_name: prev.institution_name || template.config.institution_name,
      institution_subtitle: prev.institution_subtitle || template.config.institution_subtitle,
      institution_logo_url: prev.institution_logo_url,
      signature_image_url: prev.signature_image_url,
      signature_name: prev.signature_name,
      signature_title: prev.signature_title,
      back_validation_url: prev.back_validation_url,
    }));
    toast({
      title: `Template "${template.name}" aplicado!`,
      description: 'As configurações foram atualizadas. Personalize conforme necessário.',
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!savedConfig?.id) throw new Error('Config não encontrada');
      
      const { error } = await supabase
        .from('certificate_config')
        .update({
          ...config,
          updated_by: user?.id,
        })
        .eq('id', savedConfig.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificate-config'] });
      toast({
        title: 'Configurações salvas!',
        description: 'As alterações serão aplicadas nos próximos certificados.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpload = async (file: File, type: 'logo' | 'signature') => {
    if (!file || !user) return;

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `certificates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(filePath);

      const field = type === 'logo' ? 'institution_logo_url' : 'signature_image_url';
      updateConfig(field, publicUrl);

      toast({
        title: 'Upload concluído!',
        description: `${type === 'logo' ? 'Logo' : 'Assinatura'} carregada com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro no upload',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const resetToDefaults = () => {
    setConfig({
      ...config,
      institution_name: 'Formar Ensino',
      institution_subtitle: 'Educação Online de Qualidade',
      front_title: 'CERTIFICADO DE CONCLUSÃO',
      front_subtitle: 'Certificamos que',
      front_completion_text: 'concluiu com êxito o curso',
      front_hours_text: 'com carga horária de',
      front_date_text: 'Concluído em',
      front_score_text: 'com aproveitamento de',
      back_title: 'INFORMAÇÕES DO CERTIFICADO',
      back_content: 'Este certificado é válido em todo território nacional como curso livre, conforme a Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04.',
      back_validation_text: 'Para validar este certificado, acesse:',
      primary_color: '#3B82F6',
      secondary_color: '#7C3AED',
      text_color: '#1F2937',
      background_color: '#FFFFFF',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Configuração do Certificado
          </h1>
          <p className="text-muted-foreground">
            Personalize a aparência e o conteúdo dos certificados
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
          >
            {showPreview ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button 
            variant="hero" 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-[1fr,350px]' : ''}`}>
        <div className="space-y-6">
          <Tabs defaultValue="templates" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
              <TabsTrigger value="templates" className="flex items-center gap-2 py-2">
                <LayoutTemplate className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="institution" className="flex items-center gap-2 py-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Instituição</span>
              </TabsTrigger>
              <TabsTrigger value="front" className="flex items-center gap-2 py-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Frente</span>
              </TabsTrigger>
              <TabsTrigger value="back" className="flex items-center gap-2 py-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Verso</span>
              </TabsTrigger>
              <TabsTrigger value="signature" className="flex items-center gap-2 py-2">
                <PenTool className="h-4 w-4" />
                <span className="hidden sm:inline">Assinatura</span>
              </TabsTrigger>
              <TabsTrigger value="style" className="flex items-center gap-2 py-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Estilo</span>
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Templates Pré-definidos</CardTitle>
                  <CardDescription>
                    Escolha um template como ponto de partida e personalize conforme necessário
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CertificateTemplates 
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={applyTemplate}
                  />
                </CardContent>
              </Card>
            </TabsContent>

        {/* Institution Tab */}
        <TabsContent value="institution">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Instituição</CardTitle>
              <CardDescription>
                Informações que aparecerão no cabeçalho do certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="institution_name">Nome da Instituição</Label>
                  <Input
                    id="institution_name"
                    value={config.institution_name || ''}
                    onChange={(e) => updateConfig('institution_name', e.target.value)}
                    placeholder="Formar Ensino"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution_subtitle">Subtítulo</Label>
                  <Input
                    id="institution_subtitle"
                    value={config.institution_subtitle || ''}
                    onChange={(e) => updateConfig('institution_subtitle', e.target.value)}
                    placeholder="Educação Online de Qualidade"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo da Instituição</Label>
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                    {config.institution_logo_url ? (
                      <img 
                        src={config.institution_logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file, 'logo');
                      }}
                      disabled={uploading === 'logo'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: PNG transparente, 200x200px ou maior
                    </p>
                    {config.institution_logo_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateConfig('institution_logo_url', null)}
                      >
                        Remover Logo
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Front Tab */}
        <TabsContent value="front">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo da Frente</CardTitle>
              <CardDescription>
                Textos que aparecem na parte principal do certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="front_title">Título Principal</Label>
                  <Input
                    id="front_title"
                    value={config.front_title || ''}
                    onChange={(e) => updateConfig('front_title', e.target.value)}
                    placeholder="CERTIFICADO DE CONCLUSÃO"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="front_subtitle">Subtítulo</Label>
                  <Input
                    id="front_subtitle"
                    value={config.front_subtitle || ''}
                    onChange={(e) => updateConfig('front_subtitle', e.target.value)}
                    placeholder="Certificamos que"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="front_completion_text">Texto de Conclusão</Label>
                  <Input
                    id="front_completion_text"
                    value={config.front_completion_text || ''}
                    onChange={(e) => updateConfig('front_completion_text', e.target.value)}
                    placeholder="concluiu com êxito o curso"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="front_hours_text">Texto de Carga Horária</Label>
                  <Input
                    id="front_hours_text"
                    value={config.front_hours_text || ''}
                    onChange={(e) => updateConfig('front_hours_text', e.target.value)}
                    placeholder="com carga horária de"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="front_date_text">Texto de Data</Label>
                  <Input
                    id="front_date_text"
                    value={config.front_date_text || ''}
                    onChange={(e) => updateConfig('front_date_text', e.target.value)}
                    placeholder="Concluído em"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="front_score_text">Texto de Nota</Label>
                  <Input
                    id="front_score_text"
                    value={config.front_score_text || ''}
                    onChange={(e) => updateConfig('front_score_text', e.target.value)}
                    placeholder="com aproveitamento de"
                  />
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Preview da Frente:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>{config.front_title}</strong><br />
                  {config.front_subtitle} <span className="text-primary">[Nome do Aluno]</span> {config.front_completion_text}<br />
                  <span className="text-primary">[Nome do Curso]</span><br />
                  {config.front_hours_text} <span className="text-primary">[X]</span> horas<br />
                  {config.front_date_text} <span className="text-primary">[Data]</span> {config.front_score_text} <span className="text-primary">[Nota]</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Back Tab */}
        <TabsContent value="back">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Verso</CardTitle>
              <CardDescription>
                Informações adicionais e validação do certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Exibir Verso</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar a página de verso no PDF
                  </p>
                </div>
                <Switch
                  checked={config.show_back_side ?? true}
                  onCheckedChange={(checked) => updateConfig('show_back_side', checked)}
                />
              </div>

              {config.show_back_side && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="back_title">Título do Verso</Label>
                    <Input
                      id="back_title"
                      value={config.back_title || ''}
                      onChange={(e) => updateConfig('back_title', e.target.value)}
                      placeholder="INFORMAÇÕES DO CERTIFICADO"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="back_content">Conteúdo Principal</Label>
                    <Textarea
                      id="back_content"
                      value={config.back_content || ''}
                      onChange={(e) => updateConfig('back_content', e.target.value)}
                      placeholder="Texto com informações sobre validade do certificado..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Informações legais, validade, etc.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="back_validation_text">Texto de Validação</Label>
                      <Input
                        id="back_validation_text"
                        value={config.back_validation_text || ''}
                        onChange={(e) => updateConfig('back_validation_text', e.target.value)}
                        placeholder="Para validar este certificado, acesse:"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="back_validation_url">URL de Validação</Label>
                      <Input
                        id="back_validation_url"
                        value={config.back_validation_url || ''}
                        onChange={(e) => updateConfig('back_validation_url', e.target.value)}
                        placeholder="https://seusite.com/validar"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Exibir QR Code</Label>
                      <p className="text-sm text-muted-foreground">
                        QR Code para validação rápida
                      </p>
                    </div>
                    <Switch
                      checked={config.show_qr_code ?? true}
                      onCheckedChange={(checked) => updateConfig('show_qr_code', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signature Tab */}
        <TabsContent value="signature">
          <Card>
            <CardHeader>
              <CardTitle>Assinatura</CardTitle>
              <CardDescription>
                Informações de quem assina o certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signature_name">Nome do Signatário</Label>
                  <Input
                    id="signature_name"
                    value={config.signature_name || ''}
                    onChange={(e) => updateConfig('signature_name', e.target.value)}
                    placeholder="Diretor(a) Acadêmico(a)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature_title">Cargo/Título</Label>
                  <Input
                    id="signature_title"
                    value={config.signature_title || ''}
                    onChange={(e) => updateConfig('signature_title', e.target.value)}
                    placeholder="Formar Ensino"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagem da Assinatura (opcional)</Label>
                <div className="flex items-start gap-4">
                  <div className="w-48 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                    {config.signature_image_url ? (
                      <img 
                        src={config.signature_image_url} 
                        alt="Assinatura" 
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <PenTool className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file, 'signature');
                      }}
                      disabled={uploading === 'signature'}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recomendado: PNG transparente com a assinatura
                    </p>
                    {config.signature_image_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateConfig('signature_image_url', null)}
                      >
                        Remover Assinatura
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style">
          <Card>
            <CardHeader>
              <CardTitle>Estilo Visual</CardTitle>
              <CardDescription>
                Cores e aparência do certificado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="primary_color"
                      value={config.primary_color || '#3B82F6'}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.primary_color || '#3B82F6'}
                      onChange={(e) => updateConfig('primary_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="secondary_color"
                      value={config.secondary_color || '#7C3AED'}
                      onChange={(e) => updateConfig('secondary_color', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.secondary_color || '#7C3AED'}
                      onChange={(e) => updateConfig('secondary_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text_color">Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="text_color"
                      value={config.text_color || '#1F2937'}
                      onChange={(e) => updateConfig('text_color', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.text_color || '#1F2937'}
                      onChange={(e) => updateConfig('text_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="background_color">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="background_color"
                      value={config.background_color || '#FFFFFF'}
                      onChange={(e) => updateConfig('background_color', e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={config.background_color || '#FFFFFF'}
                      onChange={(e) => updateConfig('background_color', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gradiente de Destaque</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar gradiente entre as cores primária e secundária
                  </p>
                </div>
                <Switch
                  checked={config.accent_gradient ?? true}
                  onCheckedChange={(checked) => updateConfig('accent_gradient', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="border_style">Estilo da Borda</Label>
                <Select
                  value={config.border_style || 'elegant'}
                  onValueChange={(value) => updateConfig('border_style', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elegant">Elegante (Dupla)</SelectItem>
                    <SelectItem value="simple">Simples</SelectItem>
                    <SelectItem value="ornate">Ornamentada</SelectItem>
                    <SelectItem value="modern">Moderna</SelectItem>
                    <SelectItem value="none">Sem Borda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color Preview */}
              <div className="p-6 rounded-lg border-2" style={{
                backgroundColor: config.background_color || '#FFFFFF',
                borderColor: config.primary_color || '#3B82F6',
              }}>
                <div className="text-center space-y-2">
                  <h3 
                    className="text-lg font-bold"
                    style={{ 
                      background: config.accent_gradient 
                        ? `linear-gradient(135deg, ${config.primary_color}, ${config.secondary_color})`
                        : config.primary_color,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Preview das Cores
                  </h3>
                  <p style={{ color: config.text_color || '#1F2937' }}>
                    Texto de exemplo com a cor configurada
                  </p>
                  <div 
                    className="inline-block px-4 py-2 rounded-full text-white text-sm"
                    style={{ 
                      background: config.accent_gradient 
                        ? `linear-gradient(135deg, ${config.primary_color}, ${config.secondary_color})`
                        : config.primary_color,
                    }}
                  >
                    Destaque
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </div>

        {/* Certificate Preview */}
        {showPreview && (
          <div className="hidden lg:block">
            <CertificatePreview config={config} />
          </div>
        )}
      </div>
    </div>
  );
}
