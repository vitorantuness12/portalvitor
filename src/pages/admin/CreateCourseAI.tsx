import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, FileText, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerationJob {
  id: string;
  status: string;
  topic: string;
  error_message?: string;
  course_id?: string;
  progress_detail?: string;
  created_at: string;
  updated_at?: string;
  modules_generated?: any[];
  partial_course_data?: any;
}

export default function CreateCourseAI() {
  const [formData, setFormData] = useState({
    topic: '',
    level: 'iniciante',
    duration: '10',
    categoryId: '',
    price: '0',
    contentDepth: 'detalhado',
    openaiModel: 'gpt-4o-mini',
    additionalInstructions: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedCourse, setGeneratedCourse] = useState<any>(null);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const { toast } = useToast();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Check if job is stalled (no update for 3+ minutes during processing)
  const isJobStalled = (job: GenerationJob): boolean => {
    if (job.status !== 'processing') return false;
    if (!job.updated_at) return false;
    const lastUpdate = new Date(job.updated_at).getTime();
    const now = Date.now();
    const threeMinutes = 3 * 60 * 1000;
    return (now - lastUpdate) > threeMinutes;
  };

  // Trigger job processing and poll for status
  useEffect(() => {
    if (!activeJob || activeJob.status === 'completed' || activeJob.status === 'failed') {
      return;
    }

    let isProcessing = false;
    let pollInterval: NodeJS.Timeout;
    let retryCount = 0;
    // Retomar pode falhar por timeout/rede; não podemos “desistir” em 3 tentativas.
    // Mantemos um limite alto + cooldown para evitar spam de requests.
    const maxRetries = 100;
    const resumeCooldownMs = 30_000;
    let lastResumeAt = 0;
    let lastSeenUpdatedAt = activeJob.updated_at ? new Date(activeJob.updated_at).getTime() : 0;

    // Function to trigger job processing (or resume)
    const triggerProcessing = async (isRetry = false) => {
      if (isProcessing) return;
      isProcessing = true;

      try {
        console.log(isRetry ? 'Resuming stalled job:' : 'Triggering job processing:', activeJob.id);
        
        if (isRetry) {
          setActiveJob(prev => prev ? { 
            ...prev, 
            progress_detail: `Retomando geração (tentativa ${retryCount + 1})...` 
          } : null);
          toast({
            title: 'Retomando geração',
            description: 'O job parecia travado. Retomando de onde parou...',
          });
        }
        
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60_000);

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-course`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            processJob: true,
            jobId: activeJob.id,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const rawText = await response.text();
        let result: any;
        try {
          result = rawText ? JSON.parse(rawText) : { success: false, error: `HTTP ${response.status}` };
        } catch {
          result = { success: false, error: rawText || `HTTP ${response.status}` };
        }
        console.log('Job processing result:', result);

        if (result.success) {
          setCurrentStep(3);
          setIsGenerating(false);
          retryCount = 0;
          
          if (result.courseId || result.course) {
            const courseId = result.courseId || result.course?.id;
            const { data: course } = await supabase
              .from('courses')
              .select('*')
              .eq('id', courseId)
              .single();
            
            if (course) {
              setGeneratedCourse(course);
              setActiveJob(prev => prev ? { ...prev, status: 'completed', course_id: courseId, progress_detail: 'Curso criado com sucesso!' } : null);
              toast({
                title: 'Curso criado com sucesso!',
                description: `"${course.title}" foi gerado e está disponível.`,
              });
            }
          }
        } else if (result.error) {
          // Check if it's a timeout-like error that we can retry
          if (isRetry && retryCount < maxRetries && result.error.includes('timeout')) {
            retryCount++;
            console.log(`Retry ${retryCount}/${maxRetries} scheduled...`);
            // Will retry on next poll cycle
          } else {
            setIsGenerating(false);
            setActiveJob(prev => prev ? { ...prev, status: 'failed', error_message: result.error } : null);
            toast({
              title: 'Erro ao gerar curso',
              description: result.error || 'Ocorreu um erro durante a geração.',
              variant: 'destructive',
            });
          }
        }
      } catch (error: any) {
        console.error('Error processing job:', error);
        // On network error, we'll try again on next poll if job is stalled
      } finally {
        isProcessing = false;
      }
    };

    // Start processing immediately when job is pending
    if (activeJob.status === 'pending') {
      triggerProcessing();
    }

    // Poll for job status as backup
    pollInterval = setInterval(async () => {
      const { data: job, error } = await supabase
        .from('course_generation_jobs')
        // Evita baixar o conteúdo completo dos módulos a cada 3s (payload enorme).
        .select('id,status,topic,error_message,course_id,progress_detail,created_at,updated_at')
        .eq('id', activeJob.id)
        .single();

      if (error) {
        console.error('Error polling job:', error);
        return;
      }

      const typedJob = job as unknown as GenerationJob;

      // Se o job avançou (updated_at mudou), zera tentativas para permitir novas retomadas futuras
      if (typedJob.updated_at) {
        const updatedAtMs = new Date(typedJob.updated_at).getTime();
        if (updatedAtMs && updatedAtMs !== lastSeenUpdatedAt) {
          lastSeenUpdatedAt = updatedAtMs;
          retryCount = 0;
        }
      }

      // Check if job is stalled and needs resume
      if (isJobStalled(typedJob) && retryCount < maxRetries) {
        const now = Date.now();
        if (now - lastResumeAt >= resumeCooldownMs) {
          console.log('Job appears stalled, triggering resume...');
          lastResumeAt = now;
          retryCount++;
          triggerProcessing(true);
          return;
        }
      }

      // Update progress detail
      if (typedJob.progress_detail) {
        setActiveJob(prev => prev ? { 
          ...prev, 
          progress_detail: typedJob.progress_detail,
          updated_at: typedJob.updated_at
        } : null);
      }

      if (typedJob.status === 'processing') {
        setCurrentStep(1);
        setActiveJob(typedJob);
      }

      if (typedJob.status === 'completed') {
        setCurrentStep(3);
        setIsGenerating(false);
        setActiveJob(typedJob);
        
        if (typedJob.course_id) {
          const { data: course } = await supabase
            .from('courses')
            .select('*')
            .eq('id', typedJob.course_id)
            .single();
          
          if (course) {
            setGeneratedCourse(course);
            toast({
              title: 'Curso criado com sucesso!',
              description: `"${course.title}" foi gerado e está disponível.`,
            });
          }
        }
        
        clearInterval(pollInterval);
      }

      if (typedJob.status === 'failed') {
        setIsGenerating(false);
        setActiveJob(typedJob);
        toast({
          title: 'Erro ao gerar curso',
          description: typedJob.error_message || 'Ocorreu um erro durante a geração.',
          variant: 'destructive',
        });
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds for better progress updates

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeJob?.id, activeJob?.status, toast]);

  const steps = [
    { label: 'Iniciando geração...', icon: Clock },
    { label: 'Gerando conteúdo do curso...', icon: FileText },
    { label: 'Criando exercícios e prova...', icon: BookOpen },
    { label: 'Finalizando curso...', icon: CheckCircle },
  ];

  const isO1Model = formData.openaiModel.startsWith('o1') || formData.openaiModel.startsWith('o3');
  
  // Check if sequential generation will be used
  const willUseSequential = isO1Model && (
    ['muito_extenso', 'profissional', 'enciclopedico'].includes(formData.contentDepth) ||
    parseInt(formData.duration) >= 40
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic) {
      toast({
        title: 'Tema obrigatório',
        description: 'Por favor, informe o tema do curso.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setCurrentStep(0);
    setGeneratedCourse(null);
    setActiveJob(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        throw new Error('Você precisa estar logado para criar cursos');
      }

      const timeoutMs = isO1Model ? 30000 : 600000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-course`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            topic: formData.topic,
            level: formData.level,
            duration: parseInt(formData.duration),
            categoryId: formData.categoryId || null,
            price: parseFloat(formData.price) || 0,
            contentDepth: formData.contentDepth,
            openaiModel: formData.openaiModel,
            additionalInstructions: formData.additionalInstructions,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (response.status === 402) {
          throw new Error('Créditos de IA esgotados. Adicione mais créditos para continuar.');
        }
        
        throw new Error(errorData.error || 'Erro ao gerar curso');
      }

      const result = await response.json();
      
      if (result.async && result.jobId) {
        setActiveJob({
          id: result.jobId,
          status: 'pending',
          topic: formData.topic,
          progress_detail: 'Aguardando início...',
          created_at: new Date().toISOString(),
        });
        
        toast({
          title: 'Geração iniciada!',
          description: result.message || 'O curso está sendo gerado em segundo plano.',
        });
        
        return;
      }

      setCurrentStep(steps.length - 1);
      setGeneratedCourse(result.course);
      setIsGenerating(false);

      toast({
        title: 'Curso criado com sucesso!',
        description: `"${result.course.title}" foi gerado e está disponível.`,
      });

      setFormData({
        topic: '',
        level: 'iniciante',
        duration: '10',
        categoryId: '',
        price: '0',
        contentDepth: 'detalhado',
        openaiModel: 'gpt-4o-mini',
        additionalInstructions: '',
      });
    } catch (error: any) {
      console.error('Error generating course:', error);
      setIsGenerating(false);
      
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Tempo limite excedido. Por favor, tente novamente.';
      } else if (error.message === 'Failed to fetch') {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      toast({
        title: 'Erro ao criar curso',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const getEstimatedTime = () => {
    if (!isO1Model) return '30 segundos a 2 minutos';
    
    const depth = formData.contentDepth;
    const moduleCount = parseInt(formData.duration) <= 10 ? 3 : parseInt(formData.duration) <= 20 ? 4 : parseInt(formData.duration) <= 40 ? 5 : parseInt(formData.duration) <= 60 ? 6 : 8;
    
    if (depth === 'enciclopedico') {
      return `${moduleCount * 3}-${moduleCount * 4} minutos`;
    }
    if (depth === 'profissional') {
      return `${moduleCount * 2}-${moduleCount * 3} minutos`;
    }
    if (depth === 'muito_extenso') {
      return `${moduleCount * 2}-${moduleCount * 2.5} minutos`;
    }
    return '2 a 4 minutos';
  };

  // Parse progress detail to extract module info
  const parseProgressDetail = (detail?: string) => {
    if (!detail) return null;
    
    const moduleMatch = detail.match(/módulo (\d+) de (\d+)/i);
    if (moduleMatch) {
      return {
        current: parseInt(moduleMatch[1]),
        total: parseInt(moduleMatch[2]),
        label: detail
      };
    }
    return { label: detail };
  };

  const progressInfo = parseProgressDetail(activeJob?.progress_detail);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Criar Curso com IA
        </h1>
        <p className="text-muted-foreground">
          Gere cursos completos automaticamente com inteligência artificial
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Configurar Curso</CardTitle>
              <CardDescription>
                Informe os detalhes do curso que deseja criar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="topic">Tema do Curso *</Label>
                  <Input
                    id="topic"
                    placeholder="Ex: Introdução ao Python para Iniciantes"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    disabled={isGenerating}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nível</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                      disabled={isGenerating}
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

                  <div className="space-y-2">
                    <Label>Carga Horária</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) => setFormData({ ...formData, duration: value })}
                      disabled={isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 horas</SelectItem>
                        <SelectItem value="10">10 horas</SelectItem>
                        <SelectItem value="20">20 horas</SelectItem>
                        <SelectItem value="40">40 horas</SelectItem>
                        <SelectItem value="60">60 horas</SelectItem>
                        <SelectItem value="80">80 horas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Modelo de IA</Label>
                  <Select
                    value={formData.openaiModel}
                    onValueChange={(value) => setFormData({ ...formData, openaiModel: value })}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">
                        <div className="flex flex-col">
                          <span>⚡ GPT-4o Mini</span>
                          <span className="text-xs text-muted-foreground">Rápido, até 16k tokens</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gpt-4o">
                        <div className="flex flex-col">
                          <span>🚀 GPT-4o</span>
                          <span className="text-xs text-muted-foreground">Alta qualidade, até 16k tokens</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="o1-mini">
                        <div className="flex flex-col">
                          <span>💡 O1 Mini ⭐</span>
                          <span className="text-xs text-muted-foreground">Raciocínio, até 65k tokens</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="o1">
                        <div className="flex flex-col">
                          <span>🧠 O1</span>
                          <span className="text-xs text-muted-foreground">Raciocínio avançado, até 100k tokens</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="o3-mini">
                        <div className="flex flex-col">
                          <span>✨ O3 Mini ⭐</span>
                          <span className="text-xs text-muted-foreground">Nova geração, até 100k tokens</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {isO1Model && (
                    <p className="text-xs text-primary bg-primary/10 p-2 rounded-md">
                      ℹ️ Modelos O1/O3 processam em segundo plano e suportam conteúdo muito mais extenso.
                      {willUseSequential && (
                        <span className="block mt-1 font-medium">
                          🔄 Geração sequencial ativada: cada módulo será gerado individualmente para garantir conteúdo completo.
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Todos os modelos usam sua chave OpenAI configurada
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Profundidade do Conteúdo</Label>
                  <Select
                    value={formData.contentDepth}
                    onValueChange={(value) => setFormData({ ...formData, contentDepth: value })}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">
                        <div className="flex flex-col">
                          <span>📝 Básico</span>
                          <span className="text-xs text-muted-foreground">
                            {isO1Model ? '~500 palavras/módulo' : '~500 palavras/módulo'}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="detalhado">
                        <div className="flex flex-col">
                          <span>📄 Detalhado</span>
                          <span className="text-xs text-muted-foreground">
                            {isO1Model ? '~1.500 palavras/módulo' : '~1.000 palavras/módulo'}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="extenso">
                        <div className="flex flex-col">
                          <span>📚 Extenso</span>
                          <span className="text-xs text-muted-foreground">
                            {isO1Model ? '~3.000 palavras/módulo' : '~2.000 palavras/módulo'}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="muito_extenso">
                        <div className="flex flex-col">
                          <span>📖 Muito Extenso</span>
                          <span className="text-xs text-muted-foreground">
                            {isO1Model ? '~5.000 palavras/módulo 🔄' : '~3.000 palavras/módulo'}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="profissional">
                        <div className="flex flex-col">
                          <span>🎓 Profissional</span>
                          <span className="text-xs text-muted-foreground">
                            {isO1Model ? '~7.000 palavras/módulo ⭐🔄' : '~4.000 palavras/módulo'}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="enciclopedico">
                        <div className="flex flex-col">
                          <span>📕 Enciclopédico</span>
                          <span className="text-xs text-muted-foreground">
                            {isO1Model ? '~10.000 palavras/módulo ⭐⭐🔄' : '~5.000 palavras/módulo'}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {isO1Model
                      ? '🔄 indica geração sequencial (módulo por módulo) para garantir conteúdo completo'
                      : 'Define a quantidade de texto e detalhes em cada módulo'}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      disabled={isGenerating}
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
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe 0 para curso gratuito
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instruções Adicionais (opcional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Adicione instruções específicas para a IA..."
                    value={formData.additionalInstructions}
                    onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                    disabled={isGenerating}
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      {activeJob ? 'Processando...' : 'Gerando com IA...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Gerar Curso com IA
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>O que a IA vai gerar</CardTitle>
              <CardDescription>
                Conteúdo completo para seu curso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: FileText, title: 'Conteúdo Teórico', desc: 'Material completo em módulos organizados', step: 0 },
                { icon: BookOpen, title: 'Exercícios Práticos', desc: '10 questões para fixação do conteúdo', step: 1 },
                { icon: CheckCircle, title: 'Prova Final', desc: '15 questões com correção automática', step: 2 },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                    isGenerating && currentStep >= item.step
                      ? 'border-primary bg-primary/5'
                      : generatedCourse
                      ? 'border-success bg-success/5'
                      : 'border-border'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isGenerating && currentStep >= item.step
                        ? 'bg-primary text-primary-foreground'
                        : generatedCourse
                        ? 'bg-success text-white'
                        : 'bg-secondary'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  {(isGenerating && currentStep > item.step) || generatedCourse ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : isGenerating && currentStep === item.step ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary" />
                  ) : null}
                </div>
              ))}

              {isGenerating && (
                <div className="p-4 bg-primary/5 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {activeJob?.progress_detail || steps[currentStep]?.label}
                  </p>
                  
                  {/* Module-by-module progress bar */}
                  {progressInfo && 'current' in progressInfo && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Módulo {progressInfo.current} de {progressInfo.total}</span>
                        <span>{Math.round((progressInfo.current / progressInfo.total) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(progressInfo.current / progressInfo.total) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  {/* General progress bar for non-module states */}
                  {(!progressInfo || !('current' in progressInfo)) && (
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ 
                          width: activeJob 
                            ? activeJob.status === 'processing' ? '60%' : '20%'
                            : `${((currentStep + 1) / steps.length) * 100}%` 
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tempo estimado: {getEstimatedTime()}
                    {activeJob && ' (processamento em segundo plano)'}
                  </p>
                </div>
              )}

              {activeJob?.status === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-destructive/10 rounded-lg border border-destructive"
                >
                  <p className="font-medium text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Erro na geração
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeJob.error_message || 'Ocorreu um erro. Tente novamente.'}
                  </p>
                </motion.div>
              )}

              {generatedCourse && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-success/10 rounded-lg border border-success"
                >
                  <p className="font-medium text-success flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Curso gerado com sucesso!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    "{generatedCourse.title}" está disponível na vitrine.
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Dica</p>
                  <p>
                    {isO1Model 
                      ? willUseSequential
                        ? 'Para profundidades extensas, cada módulo é gerado separadamente para garantir conteúdo completo. O processo pode levar mais tempo, mas cada módulo terá o conteúdo solicitado.'
                        : 'Modelos O1/O3 processam em segundo plano. Você pode fechar esta página - o curso será criado automaticamente.'
                      : 'Seja específico no tema do curso para obter melhores resultados. Por exemplo, ao invés de "Excel", use "Excel para Gestão Financeira de Pequenas Empresas".'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
