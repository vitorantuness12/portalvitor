import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function TopicGenerator() {
  const { toast } = useToast();
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
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

  const handleGenerate = async () => {
    if (!categoryId) {
      toast({
        title: 'Selecione uma categoria',
        description: 'É necessário escolher uma categoria para gerar temas.',
        variant: 'destructive',
      });
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    if (!selectedCategory) return;

    setIsGenerating(true);
    setGeneratedTopics([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Você precisa estar logado');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-topics`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            categoryName: selectedCategory.name,
            categoryDescription: selectedCategory.description,
            quantity: parseInt(quantity),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar temas');
      }

      const data = await response.json();
      setGeneratedTopics(data.topics || []);

      toast({
        title: 'Temas gerados com sucesso!',
        description: `${data.topics?.length || 0} temas foram gerados.`,
      });
    } catch (error: any) {
      console.error('Error generating topics:', error);
      toast({
        title: 'Erro ao gerar temas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (topic: string, index: number) => {
    try {
      await navigator.clipboard.writeText(topic);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: 'Copiado!',
        description: 'Tema copiado para a área de transferência.',
      });
    } catch {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive',
      });
    }
  };

  const copyAllToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedTopics.join('\n'));
      toast({
        title: 'Todos copiados!',
        description: 'Todos os temas foram copiados.',
      });
    } catch {
      toast({
        title: 'Erro ao copiar',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">
          Gerador de Temas
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere ideias de temas para cursos usando inteligência artificial
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A IA irá gerar temas relacionados a esta categoria
              </p>
            </div>

            <div className="space-y-2">
              <Label>Quantidade de Temas</Label>
              <Select value={quantity} onValueChange={setQuantity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 temas</SelectItem>
                  <SelectItem value="20">20 temas</SelectItem>
                  <SelectItem value="30">30 temas</SelectItem>
                  <SelectItem value="40">40 temas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !categoryId}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando temas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Temas com IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Temas Gerados
            </CardTitle>
            {generatedTopics.length > 0 && (
              <Button variant="outline" size="sm" onClick={copyAllToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Todos
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative rounded-full bg-primary/10 p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <p className="text-muted-foreground text-center">
                  A IA está gerando temas criativos...
                </p>
              </div>
            ) : generatedTopics.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {generatedTopics.map((topic, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <span className="text-sm flex-1">{topic}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(topic, index)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Lightbulb className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Selecione uma categoria e clique em gerar para ver os temas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
