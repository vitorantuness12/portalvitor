import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { OnboardingStep1 } from '@/components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '@/components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '@/components/onboarding/OnboardingStep3';
import logo from '@/assets/icone_formak.png';
import confetti from 'canvas-confetti';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if onboarding is already completed
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-onboarding', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Redirect if not authenticated or onboarding already completed
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (profile?.onboarding_completed) {
      navigate('/meus-cursos');
    }
  }, [user, authLoading, profile, navigate]);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, icon')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch recommended free courses based on selected categories
  const { data: recommendedCourses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['recommended-courses', selectedCategories],
    queryFn: async () => {
      if (selectedCategories.length === 0) return [];
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, short_description, duration_hours, thumbnail_url, level')
        .eq('status', 'active')
        .eq('price', 0)
        .in('category_id', selectedCategories)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: currentStep === 2 && selectedCategories.length > 0,
  });

  // Save interests mutation
  const saveInterestsMutation = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Delete existing interests first
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);

      // Insert new interests
      const interests = categoryIds.map((categoryId) => ({
        user_id: user.id,
        category_id: categoryId,
      }));

      const { error } = await supabase
        .from('user_interests')
        .insert(interests);

      if (error) throw error;
    },
  });

  // Enroll in course mutation
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'in_progress',
          progress: 0,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('Você já está inscrito neste curso');
        }
        throw error;
      }
    },
    onSuccess: (_, courseId) => {
      setEnrolledCourses((prev) => [...prev, courseId]);
      toast({
        title: 'Inscrição realizada! 🎉',
        description: 'Você foi inscrito no curso com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao inscrever',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Trigger confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      queryClient.invalidateQueries({ queryKey: ['profile'] });

      setTimeout(() => {
        navigate(enrolledCourses.length > 0 ? '/meus-cursos' : '/cursos');
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: 'Erro ao finalizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      if (prev.length >= 3) {
        toast({
          title: 'Limite atingido',
          description: 'Você pode selecionar no máximo 3 categorias.',
          variant: 'destructive',
        });
        return prev;
      }
      return [...prev, categoryId];
    });
  };

  const handleStep1Next = async () => {
    try {
      await saveInterestsMutation.mutateAsync(selectedCategories);
      setCurrentStep(2);
    } catch (error) {
      toast({
        title: 'Erro ao salvar interesses',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingCourseId(courseId);
    try {
      await enrollMutation.mutateAsync(courseId);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleComplete = () => {
    completeOnboardingMutation.mutate();
  };

  // Show loading while checking auth and profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const userName = profile?.full_name?.split(' ')[0] || 'Aluno';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Formak" className="h-8 w-8 object-contain" />
            <span className="text-lg font-display font-bold">Formak</span>
          </div>
          <OnboardingProgress currentStep={currentStep} totalSteps={3} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <OnboardingStep1
                key="step1"
                userName={userName}
                categories={categories}
                selectedCategories={selectedCategories}
                onToggleCategory={handleToggleCategory}
                onNext={handleStep1Next}
                isLoading={categoriesLoading}
              />
            )}
            {currentStep === 2 && (
              <OnboardingStep2
                key="step2"
                courses={recommendedCourses}
                enrolledCourses={enrolledCourses}
                onEnroll={handleEnroll}
                onNext={() => setCurrentStep(3)}
                isLoading={coursesLoading}
                enrollingCourseId={enrollingCourseId}
              />
            )}
            {currentStep === 3 && (
              <OnboardingStep3
                key="step3"
                onComplete={handleComplete}
                isCompleting={completeOnboardingMutation.isPending}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Skip button */}
      {currentStep < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-6 right-6"
        >
          <button
            onClick={handleComplete}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Pular onboarding
          </button>
        </motion.div>
      )}
    </div>
  );
}
