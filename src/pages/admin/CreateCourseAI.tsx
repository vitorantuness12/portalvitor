import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, FileText, CheckCircle } from 'lucide-react';
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
    additionalInstructions: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
    'Gerando conteúdo do curso...',
    'Criando exercícios práticos...',
    'Elaborando prova final...',
    'Finalizando curso...',
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

    // Simulate AI generation steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // For now, create a basic course (AI generation will be implemented with Edge Function)
    try {
      const { error } = await supabase.from('courses').insert({
        title: formData.topic,
        description: `Curso completo sobre ${formData.topic}. Este curso foi gerado com inteligência artificial e oferece conteúdo de qualidade para o nível ${formData.level}.`,
        short_description: `Aprenda ${formData.topic} do zero ao avançado.`,
        category_id: formData.categoryId || null,
        duration_hours: parseInt(formData.duration),
        level: formData.level,
        price: 0,
        status: 'active',
      });

      if (error) throw error;

      toast({
        title: 'Curso criado com sucesso!',
        description: 'O curso foi gerado e está disponível na vitrine.',
      });

      setFormData({
        topic: '',
        level: 'iniciante',
        duration: '10',
        categoryId: '',
        additionalInstructions: '',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar curso',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                      Gerando...
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
                { icon: FileText, title: 'Conteúdo em PDF', desc: 'Material teórico completo e organizado' },
                { icon: BookOpen, title: 'Exercícios Práticos', desc: 'Questões para fixação do conteúdo' },
                { icon: CheckCircle, title: 'Prova Final', desc: 'Avaliação com correção automática' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                    isGenerating && currentStep >= i
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isGenerating && currentStep >= i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  {isGenerating && currentStep >= i && (
                    <CheckCircle className="h-5 w-5 text-success ml-auto" />
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm font-medium text-primary">
                    {steps[currentStep]}
                  </p>
                  <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
