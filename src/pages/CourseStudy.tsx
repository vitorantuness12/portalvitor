import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, FileText, CheckCircle, ArrowLeft, ArrowRight, 
  Trophy, Lock, ChevronDown, ChevronUp, Award, StickyNote,
  Sparkles, Target
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseNotes } from '@/components/courses/CourseNotes';
import { FormattedContent } from '@/components/courses/FormattedContent';
import { QuestionCard } from '@/components/courses/QuestionCard';
import { cn } from '@/lib/utils';

interface Module {
  title: string;
  content: string;
}

interface Exercise {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
}

export default function CourseStudy() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('conteudo');
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<string, number>>({});
  const [exerciseResults, setExerciseResults] = useState<Record<string, boolean> | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [showExamResults, setShowExamResults] = useState(false);

  // Fetch course data
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch enrollment
  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ['enrollment', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch exercises
  const { data: exercises } = useQuery({
    queryKey: ['course-exercises', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_exercises')
        .select('*')
        .eq('course_id', id)
        .order('order_index');
      if (error) throw error;
      return data as Exercise[];
    },
    enabled: !!id && !!enrollment,
  });

  // Fetch exam questions
  const { data: examQuestions } = useQuery({
    queryKey: ['course-exam', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_exams')
        .select('*')
        .eq('course_id', id)
        .order('order_index');
      if (error) throw error;
      return data as Exercise[];
    },
    enabled: !!id && !!enrollment,
  });

  // Update enrollment progress
  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      if (!enrollment) return;
      const { error } = await supabase
        .from('enrollments')
        .update({ progress })
        .eq('id', enrollment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
    },
  });

  // Submit exam
  const submitExamMutation = useMutation({
    mutationFn: async (score: number) => {
      if (!enrollment) throw new Error('Matrícula não encontrada');
      
      const status = score >= 7 ? 'passed' : 'failed';
      
      const { error } = await supabase
        .from('enrollments')
        .update({
          exam_score: score,
          exam_completed_at: new Date().toISOString(),
          status,
          progress: 100,
        })
        .eq('id', enrollment.id);
      
      if (error) throw error;
      return { score, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', id] });
      setShowExamResults(true);
      
      if (data.status === 'passed') {
        // Trigger confetti celebration
        const duration = 4000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = window.setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 50 * (timeLeft / duration);
          
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24', '#f59e0b'],
          });
        }, 250);

        toast({
          title: '🎉 Parabéns! Você foi aprovado!',
          description: `Sua nota: ${data.score.toFixed(1)}. Você pode gerar seu certificado!`,
        });
      } else {
        toast({
          title: 'Não foi dessa vez...',
          description: `Sua nota: ${data.score.toFixed(1)}. É necessário nota mínima 7,0 para aprovação.`,
          variant: 'destructive',
        });
      }
    },
  });

  // Parse modules from content_pdf_url (stored as JSON)
  const modules: Module[] = course?.content_pdf_url 
    ? (() => {
        try {
          return JSON.parse(course.content_pdf_url);
        } catch {
          return [];
        }
      })()
    : [];

  // Calculate progress
  const totalSteps = modules.length + 2; // modules + exercises + exam
  const currentProgress = enrollment?.progress || 0;

  // Redirect if not enrolled
  useEffect(() => {
    if (!enrollmentLoading && !enrollment && !courseLoading) {
      navigate(`/curso/${id}`);
    }
  }, [enrollment, enrollmentLoading, courseLoading, navigate, id]);

  const toggleModule = (index: number) => {
    setExpandedModules(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleExerciseSubmit = () => {
    if (!exercises) return;
    
    const results: Record<string, boolean> = {};
    let correctCount = 0;
    
    exercises.forEach(ex => {
      const isCorrect = exerciseAnswers[ex.id] === ex.correct_answer;
      results[ex.id] = isCorrect;
      if (isCorrect) correctCount++;
    });
    
    setExerciseResults(results);
    
    const percentage = Math.round((correctCount / exercises.length) * 100);
    toast({
      title: `Você acertou ${correctCount} de ${exercises.length} exercícios!`,
      description: `${percentage}% de acertos. ${percentage >= 70 ? 'Ótimo trabalho!' : 'Continue praticando!'}`,
    });
    
    // Update progress
    if (currentProgress < 66) {
      updateProgressMutation.mutate(66);
    }
  };

  const handleExamSubmit = () => {
    if (!examQuestions) return;
    
    const answeredAll = examQuestions.every(q => examAnswers[q.id] !== undefined);
    if (!answeredAll) {
      toast({
        title: 'Responda todas as questões',
        description: 'Você precisa responder todas as questões antes de enviar.',
        variant: 'destructive',
      });
      return;
    }
    
    let correctCount = 0;
    examQuestions.forEach(q => {
      if (examAnswers[q.id] === q.correct_answer) {
        correctCount++;
      }
    });
    
    const score = (correctCount / examQuestions.length) * 10;
    submitExamMutation.mutate(score);
  };

  const handleModuleComplete = (index: number) => {
    const progressPerModule = 33 / modules.length;
    const newProgress = Math.min(33, Math.round((index + 1) * progressPerModule));
    if (newProgress > currentProgress) {
      updateProgressMutation.mutate(newProgress);
    }
    
    if (index < modules.length - 1) {
      setCurrentModuleIndex(index + 1);
      setExpandedModules([index + 1]);
    } else {
      // Last module - go to exercises tab
      setActiveTab('exercicios');
    }
  };

  if (courseLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-full max-w-md mb-8" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course || !enrollment) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 py-4 sm:py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
            <Link
              to={`/curso/${id}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-3 sm:mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Voltar para detalhes
            </Link>
            
            <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold mb-2 line-clamp-2">
              {course.title}
            </h1>
            
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <Progress value={currentProgress} className="flex-1 h-1.5 sm:h-2" />
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{currentProgress}%</span>
            </div>
            
            {enrollment.status === 'passed' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-success/10 border border-success/20 rounded-lg"
              >
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-success flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-success text-sm sm:text-base">Curso concluído!</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    Nota: {enrollment.exam_score?.toFixed(1)} • 
                    <Link to={`/curso/${id}/certificado`} className="text-primary hover:underline ml-1">
                      Gerar certificado
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="conteudo" className="gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Conteúdo</span>
              </TabsTrigger>
              <TabsTrigger value="notas" className="gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm">
                <StickyNote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Notas</span>
              </TabsTrigger>
              <TabsTrigger value="exercicios" className="gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Exercícios</span>
              </TabsTrigger>
              <TabsTrigger 
                value="prova" 
                className="gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm"
                disabled={currentProgress < 66}
              >
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Prova</span>
                {currentProgress < 66 && <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="conteudo" className="space-y-3 sm:space-y-4">
              {modules.length === 0 ? (
                <Card>
                  <CardContent className="py-8 sm:py-12 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Conteúdo do curso em breve.</p>
                  </CardContent>
                </Card>
              ) : (
                modules.map((module, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={expandedModules.includes(index) ? 'border-primary' : ''}>
                      <CardHeader 
                        className="cursor-pointer p-3 sm:p-6"
                        onClick={() => toggleModule(index)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 ${
                              index <= currentModuleIndex 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                            <CardTitle className="text-sm sm:text-lg line-clamp-2">{module.title}</CardTitle>
                          </div>
                          {expandedModules.includes(index) ? (
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      
                      <AnimatePresence>
                        {expandedModules.includes(index) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                                            <CardContent className="pt-0 px-3 pb-3 sm:px-6 sm:pb-6">
                                              <FormattedContent 
                                                content={module.content} 
                                                className="text-sm sm:text-base"
                                              />
                              
                              <div className="flex justify-end mt-4 sm:mt-6">
                                <Button 
                                  onClick={() => handleModuleComplete(index)}
                                  variant={index < modules.length - 1 ? 'default' : 'hero'}
                                  size="sm"
                                  className="text-xs sm:text-sm"
                                >
                                  {index < modules.length - 1 ? (
                                    <>
                                      Próximo
                                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </>
                                  ) : (
                                    <>
                                      Exercícios
                                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                ))
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notas" className="space-y-4">
              {user && enrollment && (
                <CourseNotes 
                  courseId={id!}
                  enrollmentId={enrollment.id}
                  userId={user.id}
                />
              )}
            </TabsContent>
            <TabsContent value="exercicios" className="space-y-4 sm:space-y-6">
              {!exercises || exercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary/50" />
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">Exercícios em breve.</p>
                </div>
              ) : (
                <>
                  {/* Progress header */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base">Exercícios de Fixação</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {Object.keys(exerciseAnswers).length} de {exercises.length} respondidas
                        </p>
                      </div>
                    </div>
                    {exerciseResults && (
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-bold text-primary">
                          {Object.values(exerciseResults).filter(Boolean).length}/{exercises.length}
                        </p>
                        <p className="text-xs text-muted-foreground">acertos</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Questions */}
                  <div className="space-y-4 sm:space-y-5">
                    {exercises.map((exercise, index) => (
                      <QuestionCard
                        key={exercise.id}
                        index={index}
                        question={exercise.question}
                        options={exercise.options as string[]}
                        selectedAnswer={exerciseAnswers[exercise.id]}
                        correctAnswer={exercise.correct_answer}
                        showResult={!!exerciseResults}
                        disabled={!!exerciseResults}
                        onAnswerChange={(answer) => 
                          setExerciseAnswers(prev => ({ ...prev, [exercise.id]: answer }))
                        }
                        variant="exercise"
                      />
                    ))}
                  </div>
                  
                  {/* Action button */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center pt-4 sm:pt-6"
                  >
                    {!exerciseResults ? (
                      <Button 
                        variant="hero" 
                        size="lg"
                        onClick={handleExerciseSubmit}
                        disabled={Object.keys(exerciseAnswers).length < exercises.length}
                        className="w-full sm:w-auto px-8 gap-2"
                      >
                        <Sparkles className="h-5 w-5" />
                        Verificar Respostas
                      </Button>
                    ) : (
                      <Button 
                        variant="hero" 
                        size="lg"
                        onClick={() => setActiveTab('prova')}
                        className="w-full sm:w-auto px-8 gap-2"
                      >
                        <Trophy className="h-5 w-5" />
                        Ir para Prova Final
                      </Button>
                    )}
                  </motion.div>
                </>
              )}
            </TabsContent>

            {/* Exam Tab */}
            <TabsContent value="prova" className="space-y-4 sm:space-y-6">
              {enrollment.exam_completed_at ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'relative overflow-hidden rounded-3xl border-2 p-8 sm:p-12 text-center',
                    enrollment.status === 'passed'
                      ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent'
                      : 'border-rose-500/50 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent'
                  )}
                >
                  {/* Decorative elements */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className={cn(
                      'absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl',
                      enrollment.status === 'passed' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                    )} />
                    <div className={cn(
                      'absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl',
                      enrollment.status === 'passed' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                    )} />
                  </div>

                  <div className="relative">
                    {enrollment.status === 'passed' ? (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                          className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                        >
                          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </motion.div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                          Parabéns! Aprovado!
                        </h2>
                        <p className="text-muted-foreground mb-6 text-base sm:text-lg">
                          Sua nota: <span className="font-bold text-emerald-500 text-xl">{enrollment.exam_score?.toFixed(1)}</span>
                        </p>
                        <Link to={`/curso/${id}/certificado`}>
                          <Button variant="hero" size="lg" className="gap-2 px-8">
                            <Award className="h-5 w-5" />
                            Gerar Certificado
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                          className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-xl shadow-rose-500/30"
                        >
                          <span className="text-4xl sm:text-5xl">😔</span>
                        </motion.div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-rose-500">
                          Não foi dessa vez...
                        </h2>
                        <p className="text-muted-foreground mb-2 text-base sm:text-lg">
                          Sua nota: <span className="font-bold text-rose-500 text-xl">{enrollment.exam_score?.toFixed(1)}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          É necessário nota mínima 7,0 para aprovação.
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Exam info banner */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-2 border-amber-500/30"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                      <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm sm:text-base">Prova Final</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Nota mínima <span className="font-bold text-amber-600">7,0</span> para aprovação e certificado
                      </p>
                    </div>
                  </motion.div>

                  {!examQuestions || examQuestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center mb-4">
                        <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-amber-500/50" />
                      </div>
                      <p className="text-muted-foreground text-sm sm:text-base">Prova em breve.</p>
                    </div>
                  ) : (
                    <>
                      {/* Questions */}
                      <div className="space-y-4 sm:space-y-5">
                        {examQuestions.map((question, index) => (
                          <QuestionCard
                            key={question.id}
                            index={index}
                            question={question.question}
                            options={question.options as string[]}
                            selectedAnswer={examAnswers[question.id]}
                            onAnswerChange={(answer) => 
                              setExamAnswers(prev => ({ ...prev, [question.id]: answer }))
                            }
                            variant="exam"
                          />
                        ))}
                      </div>
                      
                      {/* Submit button */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex justify-center pt-4 sm:pt-6"
                      >
                        <Button 
                          variant="hero" 
                          size="lg"
                          onClick={handleExamSubmit}
                          disabled={submitExamMutation.isPending}
                          className="w-full sm:w-auto px-8 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          {submitExamMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Trophy className="h-5 w-5" />
                              Enviar Prova
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
