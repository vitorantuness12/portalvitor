import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, FileText, CheckCircle, AlertCircle } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const steps = [
    { label: 'Gerando conteúdo do curso...', icon: FileText },
    { label: 'Criando exercícios práticos...', icon: BookOpen },
    { label: 'Elaborando prova final...', icon: CheckCircle },
    { label: 'Finalizando curso...', icon: Sparkles },
  ];

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

    // Simulate progress through steps while AI generates
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 8000);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        throw new Error('Você precisa estar logado para criar cursos');
      }

      // Timeout de 10 minutos para cursos com conteúdo extenso
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000);

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

      clearInterval(stepInterval);

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
      
      setCurrentStep(steps.length - 1);
      setGeneratedCourse(result.course);

      toast({
        title: 'Curso criado com sucesso!',
        description: `"${result.course.title}" foi gerado com ${result.course.exercisesCount} exercícios e ${result.course.examQuestionsCount} questões de prova.${result.course.subtitle ? ` Subtítulo: "${result.course.subtitle}"` : ''}`,
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
      clearInterval(stepInterval);
      console.error('Error generating course:', error);
      
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'A geração do curso demorou muito. Tente novamente ou selecione um nível de profundidade menor.';
      } else if (error.message === 'Failed to fetch') {
        errorMessage = 'Erro de conexão. A geração pode estar demorando. Verifique na lista de cursos se foi criado.';
      }
      
      toast({
        title: 'Erro ao criar curso',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
                          <span className="text-xs text-muted-foreground">OpenAI - Rápido e econômico</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="gpt-4o">
                        <div className="flex flex-col">
                          <span>🚀 GPT-4o</span>
                          <span className="text-xs text-muted-foreground">OpenAI - Alta qualidade</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="google/gemini-2.5-pro">
                        <div className="flex flex-col">
                          <span>🌟 Gemini 2.5 Pro</span>
                          <span className="text-xs text-muted-foreground">Google - Top qualidade, contexto extenso</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="google/gemini-2.5-flash">
                        <div className="flex flex-col">
                          <span>⚡ Gemini 2.5 Flash</span>
                          <span className="text-xs text-muted-foreground">Google - Rápido e equilibrado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="google/gemini-3-flash-preview">
                        <div className="flex flex-col">
                          <span>✨ Gemini 3 Flash</span>
                          <span className="text-xs text-muted-foreground">Google - Nova geração, rápido</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="openai/gpt-5">
                        <div className="flex flex-col">
                          <span>🧠 GPT-5</span>
                          <span className="text-xs text-muted-foreground">OpenAI - Máxima qualidade</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="openai/gpt-5-mini">
                        <div className="flex flex-col">
                          <span>💡 GPT-5 Mini</span>
                          <span className="text-xs text-muted-foreground">OpenAI - Custo-benefício excelente</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.openaiModel.includes('gemini') || formData.openaiModel.includes('gpt-5')
                      ? '✅ Lovable AI - Incluído gratuitamente no seu plano'
                      : formData.openaiModel === 'gpt-4o' 
                      ? '⚠️ OpenAI direto: maior qualidade, mas consome créditos da sua API'
                      : '💰 OpenAI direto: consome créditos da sua API'}
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
                          <span className="text-xs text-muted-foreground">~500 palavras/módulo - Resumido</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="detalhado">
                        <div className="flex flex-col">
                          <span>📄 Detalhado</span>
                          <span className="text-xs text-muted-foreground">~1000 palavras/módulo - Recomendado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="extenso">
                        <div className="flex flex-col">
                          <span>📚 Extenso</span>
                          <span className="text-xs text-muted-foreground">~2000 palavras/módulo - Completo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="muito_extenso">
                        <div className="flex flex-col">
                          <span>📖 Muito Extenso</span>
                          <span className="text-xs text-muted-foreground">~3000 palavras/módulo - Detalhado</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="profissional">
                        <div className="flex flex-col">
                          <span>🎓 Profissional</span>
                          <span className="text-xs text-muted-foreground">~4000 palavras/módulo - Expert</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="enciclopedico">
                        <div className="flex flex-col">
                          <span>📕 Enciclopédico</span>
                          <span className="text-xs text-muted-foreground">~5000+ palavras/módulo - Máximo</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Define a quantidade de texto e detalhes em cada módulo
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
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground mr-2" />
                      Gerando com IA...
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
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary" />
                    {steps[currentStep]?.label}
                  </p>
                  <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Isso pode levar alguns segundos...
                  </p>
                </div>
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
                    Seja específico no tema do curso para obter melhores resultados. 
                    Por exemplo, ao invés de "Excel", use "Excel para Gestão Financeira de Pequenas Empresas".
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
