import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, FileText, CheckCircle, ArrowLeft, ArrowRight, 
  Trophy, Play, Lock, ChevronDown, ChevronUp, Award, StickyNote
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
                              <div className="prose max-w-none">
                                <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-line">
                                  {module.content}
                                </p>
                              </div>
                              
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
                <Card>
                  <CardContent className="py-8 sm:py-12 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Exercícios em breve.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {exercises.map((exercise, index) => (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className={
                        exerciseResults 
                          ? exerciseResults[exercise.id] 
                            ? 'border-success bg-success/5' 
                            : 'border-destructive bg-destructive/5'
                          : ''
                      }>
                        <CardHeader className="p-3 sm:p-6">
                          <CardTitle className="text-sm sm:text-base flex items-start gap-2 sm:gap-3">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs sm:text-sm flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="leading-snug">{exercise.question}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
                          <RadioGroup
                            value={exerciseAnswers[exercise.id]?.toString()}
                            onValueChange={(value) => 
                              setExerciseAnswers(prev => ({ ...prev, [exercise.id]: parseInt(value) }))
                            }
                            disabled={!!exerciseResults}
                            className="space-y-2"
                          >
                            {(exercise.options as string[]).map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors ${
                                  exerciseResults
                                    ? optIndex === exercise.correct_answer
                                      ? 'bg-success/10 border-success'
                                      : exerciseAnswers[exercise.id] === optIndex
                                        ? 'bg-destructive/10 border-destructive'
                                        : 'border-border'
                                    : exerciseAnswers[exercise.id] === optIndex
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-muted-foreground'
                                }`}
                              >
                                <RadioGroupItem value={optIndex.toString()} id={`${exercise.id}-${optIndex}`} />
                                <Label 
                                  htmlFor={`${exercise.id}-${optIndex}`} 
                                  className="flex-1 cursor-pointer text-xs sm:text-sm"
                                >
                                  {option}
                                </Label>
                                {exerciseResults && optIndex === exercise.correct_answer && (
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                                )}
                              </div>
                            ))}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                  
                  <div className="flex justify-center pt-2 sm:pt-4">
                    {!exerciseResults ? (
                      <Button 
                        variant="hero" 
                        onClick={handleExerciseSubmit}
                        disabled={Object.keys(exerciseAnswers).length < exercises.length}
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                        Verificar Respostas
                      </Button>
                    ) : (
                      <Button 
                        variant="hero" 
                        onClick={() => setActiveTab('prova')}
                        className="w-full sm:w-auto"
                      >
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                        Ir para Prova Final
                      </Button>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Exam Tab */}
            <TabsContent value="prova" className="space-y-4 sm:space-y-6">
              {enrollment.exam_completed_at ? (
                <Card className={enrollment.status === 'passed' ? 'border-success' : 'border-destructive'}>
                  <CardContent className="py-8 sm:py-12 text-center">
                    {enrollment.status === 'passed' ? (
                      <>
                        <Trophy className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-success" />
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">Parabéns! Aprovado!</h2>
                        <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">
                          Sua nota: <span className="font-bold text-success">{enrollment.exam_score?.toFixed(1)}</span>
                        </p>
                        <Link to={`/curso/${id}/certificado`}>
                          <Button variant="hero" className="w-full sm:w-auto">
                            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                            Gerar Certificado
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                          <span className="text-2xl sm:text-3xl">😔</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">Não foi dessa vez...</h2>
                        <p className="text-muted-foreground mb-2 text-sm sm:text-base">
                          Sua nota: <span className="font-bold text-destructive">{enrollment.exam_score?.toFixed(1)}</span>
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          É necessário nota mínima 7,0 para aprovação.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="bg-warning/5 border-warning">
                    <CardContent className="py-3 sm:py-4">
                      <p className="text-xs sm:text-sm flex items-start sm:items-center gap-2">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-warning flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span>
                          <strong>Prova Final:</strong> Nota mínima <strong>7,0</strong> para aprovação e certificado.
                        </span>
                      </p>
                    </CardContent>
                  </Card>

                  {!examQuestions || examQuestions.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 sm:py-12 text-center text-muted-foreground">
                        <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                        <p className="text-sm sm:text-base">Prova em breve.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {examQuestions.map((question, index) => (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card>
                            <CardHeader className="p-3 sm:p-6">
                              <CardTitle className="text-sm sm:text-base flex items-start gap-2 sm:gap-3">
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs sm:text-sm flex-shrink-0">
                                  {index + 1}
                                </span>
                                <span className="leading-snug">{question.question}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3 pt-0 sm:px-6 sm:pb-6">
                              <RadioGroup
                                value={examAnswers[question.id]?.toString()}
                                onValueChange={(value) => 
                                  setExamAnswers(prev => ({ ...prev, [question.id]: parseInt(value) }))
                                }
                                className="space-y-2"
                              >
                                {(question.options as string[]).map((option, optIndex) => (
                                  <div 
                                    key={optIndex} 
                                    className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border transition-colors ${
                                      examAnswers[question.id] === optIndex
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-muted-foreground'
                                    }`}
                                  >
                                    <RadioGroupItem value={optIndex.toString()} id={`exam-${question.id}-${optIndex}`} />
                                    <Label 
                                      htmlFor={`exam-${question.id}-${optIndex}`} 
                                      className="flex-1 cursor-pointer text-xs sm:text-sm"
                                    >
                                      {option}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                      
                      <div className="flex justify-center pt-2 sm:pt-4">
                        <Button 
                          variant="hero" 
                          onClick={handleExamSubmit}
                          disabled={submitExamMutation.isPending}
                          className="w-full sm:w-auto"
                        >
                          {submitExamMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-primary-foreground" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Trophy className="h-4 w-4 sm:h-5 sm:w-5" />
                              Enviar Prova
                            </>
                          )}
                        </Button>
                      </div>
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
