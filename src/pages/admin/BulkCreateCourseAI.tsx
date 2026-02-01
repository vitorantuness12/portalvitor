import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, Check, X, Pause, Play, AlertCircle, Loader2, Wand2 } from 'lucide-react';
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
  status: 'pending' | 'generating' | 'success' | 'error';
  title?: string;
  category?: string;
  price?: number;
  error?: string;
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
  const pauseRef = useRef(false);
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

  const parsedTopics = topics
    .split('\n')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const completedCount = queue.filter((c) => c.status === 'success').length;
  const errorCount = queue.filter((c) => c.status === 'error').length;
  const progress = queue.length > 0 ? (completedCount / queue.length) * 100 : 0;

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
      // Check if paused
      while (pauseRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Update status to generating
      setQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'generating' } : item
        )
      );

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
          throw new Error(errorData.error || 'Erro ao gerar curso');
        }

        const result = await response.json();

        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'success', title: result.course.title, category: result.course.category, price: result.course.price }
              : item
          )
        );

        toast({
          title: `Curso ${i + 1}/${initialQueue.length} criado`,
          description: result.course.title,
        });
      } catch (error: any) {
        setQueue((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, status: 'error', error: error.message }
              : item
          )
        );

        console.error('Error generating course:', error);
      }

      // Add a small delay between courses to avoid rate limiting
      if (i < initialQueue.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsRunning(false);
    toast({
      title: 'Criação em massa concluída!',
      description: `${queue.filter((c) => c.status === 'success').length} cursos criados com sucesso.`,
    });
  };

  const handlePauseToggle = () => {
    pauseRef.current = !pauseRef.current;
    setIsPaused(!isPaused);
  };

  const handleCancel = () => {
    pauseRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
  };

  const getStatusIcon = (status: CourseQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />;
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <Check className="h-4 w-4 text-success" />;
      case 'error':
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Layers className="h-8 w-8 text-primary" />
          Criar Cursos em Massa
        </h1>
        <p className="text-muted-foreground">
          Gere múltiplos cursos automaticamente - a IA decide nível e carga horária
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
                <p className="text-xs text-muted-foreground">
                  Define a duração e quantidade de módulos dos cursos
                </p>
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
                        <span className="text-xs text-muted-foreground">Avançado, mais tokens</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {openaiModel === 'gpt-4o' 
                    ? '⚠️ Modelo avançado: maior qualidade, pode demorar mais.'
                    : 'Modelo padrão, rápido e eficiente.'}
                </p>
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
                        <span className="text-xs text-muted-foreground">~500 palavras/módulo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="detalhado">
                      <div className="flex flex-col">
                        <span>📄 Detalhado</span>
                        <span className="text-xs text-muted-foreground">~1000 palavras/módulo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="extenso">
                      <div className="flex flex-col">
                        <span>📚 Extenso</span>
                        <span className="text-xs text-muted-foreground">~2000 palavras/módulo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="muito_extenso">
                      <div className="flex flex-col">
                        <span>📖 Muito Extenso</span>
                        <span className="text-xs text-muted-foreground">~3000 palavras/módulo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="profissional">
                      <div className="flex flex-col">
                        <span>🎓 Profissional</span>
                        <span className="text-xs text-muted-foreground">~4000 palavras/módulo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="enciclopedico">
                      <div className="flex flex-col">
                        <span>📕 Enciclopédico</span>
                        <span className="text-xs text-muted-foreground">~5000+ palavras/módulo</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define a quantidade de detalhes em cada módulo
                </p>
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

              <ScrollArea className="h-[400px] pr-4">
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
                            item.status === 'generating'
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
                              {item.status === 'generating' && (
                                <p className="text-xs text-muted-foreground">
                                  Gerando conteúdo, exercícios e prova...
                                </p>
                              )}
                              {item.status === 'success' && (
                                <div className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground">
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
                                  {item.title !== item.topic && (
                                    <span className="truncate">Tema: {item.topic}</span>
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
                    <li>A IA analisa cada tema e decide automaticamente o nível, carga horária, categoria e preço</li>
                    <li>Cada curso recebe conteúdo, 10 exercícios e 15 questões de prova</li>
                    <li>Você pode pausar e retomar o processo a qualquer momento</li>
                    <li>Cursos com erro podem ser recriados individualmente depois</li>
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
