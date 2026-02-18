import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, Check, X, Pause, Play, AlertCircle, Loader2, Wand2, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CourseQueueItem {
  topic: string;
  status: 'pending' | 'analyzing' | 'generating' | 'success' | 'error';
  title?: string;
  category?: string;
  price?: number;
  level?: string;
  duration?: number;
  error?: string;
  jobId?: string;
  progressDetail?: string;
  moduleProgress?: { current: number; total: number };
}

export default function BulkCreateCourseAI() {
  const [topics, setTopics] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [autoCategory, setAutoCategory] = useState(true);
  const [price, setPrice] = useState('0');
  const [autoPrice, setAutoPrice] = useState(true);
  const [durationRange, setDurationRange] = useState('auto');
  const [contentDepth, setContentDepth] = useState('detalhado');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [queue, setQueue] = useState<CourseQueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [resumingJobId, setResumingJobId] = useState<string | null>(null);
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const { toast } = useToast();

  const isO1Model = openaiModel.startsWith('o1') || openaiModel.startsWith('o3');

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

  const parsedTopics = topics
    .split('\n')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const completedCount = queue.filter((c) => c.status === 'success').length;
  const errorCount = queue.filter((c) => c.status === 'error').length;
  const progress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

  // Parse progress detail to extract module info
  const parseProgressDetail = (detail?: string) => {
    if (!detail) return null;
    const moduleMatch = detail.match(/módulo (\d+) de (\d+)/i);
    if (moduleMatch) {
      return { current: parseInt(moduleMatch[1]), total: parseInt(moduleMatch[2]) };
    }
    return null;
  };

  // Check if job is stalled (no update for 3+ minutes)
  const isJobStalled = (updatedAt?: string): boolean => {
    if (!updatedAt) return false;
    const lastUpdate = new Date(updatedAt).getTime();
    return (Date.now() - lastUpdate) > 3 * 60 * 1000;
  };

  // Trigger processing via generate-course endpoint
  const triggerJobProcessing = useCallback(async (jobId: string): Promise<any> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-course`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ processJob: true, jobId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const rawText = await response.text();
      try {
        return rawText ? JSON.parse(rawText) : { success: false, error: `HTTP ${response.status}` };
      } catch {
        return { success: false, error: rawText || `HTTP ${response.status}` };
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return { success: false, error: 'timeout' };
      }
      return { success: false, error: error.message };
    }
  }, []);

  // Poll a single job until completion
  const pollJobUntilDone = useCallback(async (jobId: string, queueIndex: number): Promise<boolean> => {
    let retryCount = 0;
    const maxRetries = 50;
    const resumeCooldownMs = 30_000;
    let lastResumeAt = 0;
    let lastSeenUpdatedAt = 0;

    // Trigger initial processing
    triggerJobProcessing(jobId);

    // Poll loop
    while (true) {
      if (cancelRef.current) return false;

      // Wait while paused
      while (pauseRef.current && !cancelRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (cancelRef.current) return false;

      await new Promise(r => setTimeout(r, 3000));

      const { data: job, error } = await supabase
        .from('course_generation_jobs')
        .select('id,status,topic,error_message,course_id,progress_detail,created_at,updated_at')
        .eq('id', jobId)
        .single();

      if (error || !job) continue;

      const typedJob = job as any;

      // Track progress
      if (typedJob.updated_at) {
        const updatedAtMs = new Date(typedJob.updated_at).getTime();
        if (updatedAtMs !== lastSeenUpdatedAt) {
          lastSeenUpdatedAt = updatedAtMs;
          retryCount = 0;
        }
      }

      // Update queue item progress
      const moduleInfo = parseProgressDetail(typedJob.progress_detail);
      setQueue(prev => prev.map((item, idx) =>
        idx === queueIndex ? {
          ...item,
          progressDetail: typedJob.progress_detail,
          moduleProgress: moduleInfo || item.moduleProgress,
        } : item
      ));

      // Check completion
      if (typedJob.status === 'completed') {
        if (typedJob.course_id) {
          const { data: course } = await supabase
            .from('courses')
            .select('title')
            .eq('id', typedJob.course_id)
            .single();
          
          setQueue(prev => prev.map((item, idx) =>
            idx === queueIndex ? {
              ...item,
              status: 'success' as const,
              title: course?.title || item.topic,
              progressDetail: 'Curso criado com sucesso!',
            } : item
          ));
        }
        return true;
      }

      if (typedJob.status === 'failed') {
        setQueue(prev => prev.map((item, idx) =>
          idx === queueIndex ? {
            ...item,
            status: 'error' as const,
            error: typedJob.error_message || 'Erro desconhecido',
          } : item
        ));
        return false;
      }

      // Check for stall and retry
      if (isJobStalled(typedJob.updated_at) && retryCount < maxRetries) {
        const now = Date.now();
        if (now - lastResumeAt >= resumeCooldownMs) {
          console.log('Job stalled, resuming:', jobId);
          lastResumeAt = now;
          retryCount++;
          setQueue(prev => prev.map((item, idx) =>
            idx === queueIndex ? {
              ...item,
              progressDetail: `Retomando geração (tentativa ${retryCount})...`,
            } : item
          ));
          triggerJobProcessing(jobId);
        }
      }
    }
  }, [triggerJobProcessing]);

  // Manual resume for a specific course
  const handleManualResume = async (jobId: string, queueIndex: number) => {
    setResumingJobId(jobId);
    try {
      toast({ title: 'Retomando geração...', description: 'Aguarde...' });
      const result = await triggerJobProcessing(jobId);
      if (result.success && result.courseId) {
        const { data: course } = await supabase
          .from('courses')
          .select('title')
          .eq('id', result.courseId)
          .single();
        
        setQueue(prev => prev.map((item, idx) =>
          idx === queueIndex ? {
            ...item,
            status: 'success' as const,
            title: course?.title || item.topic,
            progressDetail: 'Curso criado com sucesso!',
          } : item
        ));
        toast({ title: 'Curso retomado com sucesso!' });
      } else {
        toast({ title: 'Retomada iniciada', description: 'Processando em segundo plano.' });
      }
    } catch {
      toast({ title: 'Erro ao retomar', variant: 'destructive' });
    } finally {
      setResumingJobId(null);
    }
  };

  const handleStart = async () => {
    if (parsedTopics.length === 0) {
      toast({
        title: 'Nenhum tema informado',
        description: 'Adicione pelo menos um tema de curso (um por linha).',
        variant: 'destructive',
      });
      return;
    }

    const initialQueue: CourseQueueItem[] = parsedTopics.map((topic) => ({
      topic,
      status: 'pending',
    }));

    setQueue(initialQueue);
    setIsRunning(true);
    setIsPaused(false);
    pauseRef.current = false;
    cancelRef.current = false;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast({
        title: 'Erro de autenticação',
        description: 'Você precisa estar logado para criar cursos.',
        variant: 'destructive',
      });
      setIsRunning(false);
      return;
    }

    for (let i = 0; i < initialQueue.length; i++) {
      if (cancelRef.current) break;

      // Wait while paused
      while (pauseRef.current && !cancelRef.current) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (cancelRef.current) break;

      // Step 1: Analyze topic (creates job)
      setQueue(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'analyzing' } : item
      ));

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-course-bulk`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.session.access_token}`,
            },
            body: JSON.stringify({
              topic: initialQueue[i].topic,
              categoryId: autoCategory ? null : (categoryId || null),
              autoCategory,
              price: autoPrice ? null : (parseFloat(price) || 0),
              autoPrice,
              durationRange: durationRange !== 'auto' ? durationRange : null,
              contentDepth,
              openaiModel,
              additionalInstructions,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro na análise do tema');
        }

        const result = await response.json();

        if (!result.async || !result.jobId) {
          throw new Error('Resposta inesperada do servidor');
        }

        // Update queue with analysis results
        setQueue(prev => prev.map((item, idx) =>
          idx === i ? {
            ...item,
            status: 'generating',
            jobId: result.jobId,
            category: result.analysis?.category,
            price: result.analysis?.price,
            level: result.analysis?.level,
            duration: result.analysis?.duration,
            progressDetail: 'Iniciando geração do conteúdo...',
          } : item
        ));

        toast({
          title: `Curso ${i + 1}/${initialQueue.length}: análise concluída`,
          description: `${result.analysis?.category || 'Sem categoria'} · ${result.analysis?.duration}h · R$ ${result.analysis?.price?.toFixed(2) || '0.00'}`,
        });

        // Step 2: Poll job until completion
        const success = await pollJobUntilDone(result.jobId, i);

        if (success) {
          toast({
            title: `Curso ${i + 1}/${initialQueue.length} criado!`,
          });
        }

      } catch (error: any) {
        setQueue(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'error', error: error.message } : item
        ));
        console.error('Error generating course:', error);
      }

      // Delay between courses
      if (i < initialQueue.length - 1 && !cancelRef.current) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setIsRunning(false);
    
    const finalCompleted = queue.filter(c => c.status === 'success').length;
    toast({
      title: 'Criação em massa concluída!',
      description: `${finalCompleted} cursos criados com sucesso.`,
    });
  };

  const handlePauseToggle = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    cancelRef.current = true;
    pauseRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
  };

  const getStatusIcon = (status: CourseQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />;
      case 'analyzing':
        return <Wand2 className="h-4 w-4 animate-pulse text-primary" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <Check className="h-4 w-4 text-success" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const getEstimatedTime = () => {
    const courseCount = parsedTopics.length;
    if (!isO1Model) return `~${courseCount * 2} minutos`;
    
    const depthMultiplier = contentDepth === 'enciclopedico' ? 4 : contentDepth === 'profissional' ? 3 : contentDepth === 'muito_extenso' ? 2.5 : 2;
    return `~${Math.round(courseCount * depthMultiplier)} minutos`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          Criar Cursos em Massa
        </h1>
        <p className="text-muted-foreground">
          Gere múltiplos cursos automaticamente - a IA analisa cada tema e gera o conteúdo com acompanhamento em tempo real
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Configurar Cursos</CardTitle>
              <CardDescription>
                Informe os temas (um por linha) e as configurações em comum
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topics">Temas dos Cursos *</Label>
                <Textarea
                  id="topics"
                  placeholder="Python para Iniciantes&#10;Excel Avançado para Negócios&#10;Marketing Digital na Prática&#10;Gestão de Projetos com Scrum"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  disabled={isRunning}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {parsedTopics.length} tema(s) detectado(s) - um por linha
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <div>
                      <Label htmlFor="auto-category" className="cursor-pointer">IA sugere categoria</Label>
                      <p className="text-xs text-muted-foreground">A IA escolhe a melhor categoria para cada curso</p>
                    </div>
                  </div>
                  <Switch
                    id="auto-category"
                    checked={autoCategory}
                    onCheckedChange={setAutoCategory}
                    disabled={isRunning}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {!autoCategory && (
                    <div className="space-y-2">
                      <Label>Categoria (para todos)</Label>
                      <Select
                        value={categoryId}
                        onValueChange={setCategoryId}
                        disabled={isRunning}
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
                  )}

                  {!autoPrice && (
                    <div className={`space-y-2 ${autoCategory ? 'sm:col-span-2' : ''}`}>
                      <Label htmlFor="price">Preço (R$) para todos</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={isRunning}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <div>
                    <Label htmlFor="auto-price" className="cursor-pointer">IA sugere preço</Label>
                    <p className="text-xs text-muted-foreground">A IA define o preço baseado em complexidade e duração</p>
                  </div>
                </div>
                <Switch
                  id="auto-price"
                  checked={autoPrice}
                  onCheckedChange={setAutoPrice}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <Label>Carga Horária</Label>
                <Select
                  value={durationRange}
                  onValueChange={setDurationRange}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a carga horária" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <span className="flex items-center gap-2">
                        <Wand2 className="h-3 w-3" />
                        IA decide automaticamente
                      </span>
                    </SelectItem>
                    <SelectItem value="5-10">5 a 10 horas</SelectItem>
                    <SelectItem value="10-20">10 a 20 horas</SelectItem>
                    <SelectItem value="20-40">20 a 40 horas</SelectItem>
                    <SelectItem value="60">60 horas</SelectItem>
                    <SelectItem value="80">80 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modelo de IA</Label>
                <Select
                  value={openaiModel}
                  onValueChange={setOpenaiModel}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">
                      <div className="flex flex-col">
                        <span>⚡ GPT-4o Mini</span>
                        <span className="text-xs text-muted-foreground">Rápido e econômico</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="gpt-4o">
                      <div className="flex flex-col">
                        <span>🚀 GPT-4o</span>
                        <span className="text-xs text-muted-foreground">Alta qualidade</span>
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
                    ℹ️ Modelos O1/O3 processam em segundo plano com geração sequencial (módulo por módulo) para conteúdo completo.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Profundidade do Conteúdo</Label>
                <Select
                  value={contentDepth}
                  onValueChange={setContentDepth}
                  disabled={isRunning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a profundidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-3 w-3" />
                        <span>🤖 IA decide automaticamente</span>
                      </div>
                    </SelectItem>
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
                {isO1Model && (
                  <p className="text-xs text-muted-foreground">
                    🔄 indica geração sequencial (módulo por módulo) para garantir conteúdo completo
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instruções Adicionais (opcional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Instruções que serão aplicadas a todos os cursos..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  disabled={isRunning}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                {!isRunning ? (
                  <Button
                    onClick={handleStart}
                    variant="hero"
                    size="lg"
                    className="flex-1"
                    disabled={parsedTopics.length === 0}
                  >
                    <Sparkles className="h-5 w-5" />
                    Iniciar Geração ({parsedTopics.length} cursos)
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handlePauseToggle}
                      variant="outline"
                      size="lg"
                      className="flex-1"
                    >
                      {isPaused ? (
                        <>
                          <Play className="h-5 w-5" />
                          Continuar
                        </>
                      ) : (
                        <>
                          <Pause className="h-5 w-5" />
                          Pausar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="destructive"
                      size="lg"
                    >
                      <X className="h-5 w-5" />
                      Cancelar
                    </Button>
                  </>
                )}
              </div>

              {parsedTopics.length > 0 && !isRunning && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Tempo estimado: {getEstimatedTime()}
                </div>
              )}
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
              <CardTitle className="flex items-center justify-between">
                <span>Progresso da Geração</span>
                {queue.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {completedCount}/{queue.length} concluídos
                    {errorCount > 0 && ` (${errorCount} erros)`}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {queue.length > 0 && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round(progress)}% completo
                  </p>
                </div>
              )}

              <ScrollArea className="h-[500px] pr-4">
                <AnimatePresence mode="popLayout">
                  {queue.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Os cursos aparecerão aqui durante a geração</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queue.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`p-3 rounded-lg border ${
                            item.status === 'analyzing'
                              ? 'border-primary/50 bg-primary/5'
                              : item.status === 'generating'
                              ? 'border-primary bg-primary/5'
                              : item.status === 'success'
                              ? 'border-success/50 bg-success/5'
                              : item.status === 'error'
                              ? 'border-destructive/50 bg-destructive/5'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {item.title || item.topic}
                              </p>

                              {item.status === 'analyzing' && (
                                <p className="text-xs text-muted-foreground">
                                  Analisando tema, definindo nível e carga horária...
                                </p>
                              )}

                              {item.status === 'generating' && (
                                <div className="space-y-2 mt-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    {item.progressDetail || 'Gerando conteúdo...'}
                                  </p>
                                  
                                  {/* Module progress bar */}
                                  {item.moduleProgress && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Módulo {item.moduleProgress.current}/{item.moduleProgress.total}</span>
                                        <span>{Math.round((item.moduleProgress.current / item.moduleProgress.total) * 100)}%</span>
                                      </div>
                                      <Progress 
                                        value={(item.moduleProgress.current / item.moduleProgress.total) * 100} 
                                        className="h-1.5"
                                      />
                                    </div>
                                  )}

                                  {/* Resume button */}
                                  {item.jobId && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-[10px] px-2"
                                      onClick={() => handleManualResume(item.jobId!, idx)}
                                      disabled={resumingJobId === item.jobId}
                                    >
                                      {resumingJobId === item.jobId ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      ) : (
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                      )}
                                      Retomar
                                    </Button>
                                  )}
                                </div>
                              )}

                              {item.status === 'success' && (
                                <div className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground">
                                  {item.level && (
                                    <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-[10px] font-medium capitalize">
                                      {item.level}
                                    </span>
                                  )}
                                  {item.duration && (
                                    <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-[10px] font-medium">
                                      {item.duration}h
                                    </span>
                                  )}
                                  {item.category && (
                                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium">
                                      {item.category}
                                    </span>
                                  )}
                                  {item.price !== undefined && (
                                    <span className="bg-success/10 text-success px-1.5 py-0.5 rounded text-[10px] font-medium">
                                      {item.price === 0 ? 'Grátis' : `R$ ${item.price.toFixed(2)}`}
                                    </span>
                                  )}
                                </div>
                              )}

                              {item.error && (
                                <p className="text-xs text-destructive">{item.error}</p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              #{idx + 1}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Como funciona</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>A IA analisa cada tema e define nível, carga horária, categoria e preço</li>
                    <li>Cada curso é gerado como um job assíncrono com progresso em tempo real</li>
                    <li>Módulos são gerados um a um com salvamento incremental</li>
                    <li>Se um job travar, o sistema retoma automaticamente de onde parou</li>
                    <li>Você pode pausar, retomar ou cancelar a qualquer momento</li>
                    {isO1Model && (
                      <li className="text-primary">Modelos O1/O3 geram conteúdo sequencialmente para garantir qualidade máxima</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
