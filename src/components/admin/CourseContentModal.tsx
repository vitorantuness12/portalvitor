import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FormattedContent } from '@/components/courses/FormattedContent';
import { BookOpen, FileQuestion, GraduationCap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Module {
  title: string;
  content: string;
}

interface CourseContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: string;
    title: string;
    content_pdf_url: string | null;
  };
}

export function CourseContentModal({ open, onOpenChange, course }: CourseContentModalProps) {
  const isMobile = useIsMobile();

  // Parse modules from content_pdf_url (JSON string)
  const modules: Module[] = (() => {
    try {
      if (!course.content_pdf_url) return [];
      return JSON.parse(course.content_pdf_url);
    } catch {
      return [];
    }
  })();

  // Fetch exercises
  const { data: exercises = [] } = useQuery({
    queryKey: ['course-exercises', course.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_exercises')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch exam questions
  const { data: examQuestions = [] } = useQuery({
    queryKey: ['course-exams', course.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_exams')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const renderQuestion = (
    question: {
      id: string;
      question: string;
      options: unknown;
      correct_answer: number;
      order_index: number;
    },
    index: number
  ) => {
    const options = Array.isArray(question.options) ? question.options : [];

    return (
      <div key={question.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
        <div className="flex items-start gap-2 sm:gap-3">
          <Badge variant="secondary" className="flex-shrink-0 text-xs">
            {index + 1}
          </Badge>
          <p className="font-medium text-foreground text-sm sm:text-base">{question.question}</p>
        </div>
        <div className="space-y-2 ml-6 sm:ml-8">
          {options.map((option, optIndex) => (
            <div
              key={optIndex}
              className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                optIndex === question.correct_answer
                  ? 'bg-success/20 border border-success'
                  : 'bg-muted/50'
              }`}
            >
              {optIndex === question.correct_answer ? (
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
              )}
              <span className={optIndex === question.correct_answer ? 'font-medium' : ''}>
                {String(option)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
      <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground text-sm sm:text-base">{message}</p>
    </div>
  );

  const ContentTabs = () => (
    <Tabs defaultValue="modules" className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
        <TabsTrigger value="modules" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2">
          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline sm:inline">Módulos</span>
          <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-xs h-5">
            {modules.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="exercises" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2">
          <FileQuestion className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline sm:inline">Exercícios</span>
          <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-xs h-5">
            {exercises.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="exam" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2">
          <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline sm:inline">Prova</span>
          <Badge variant="secondary" className="ml-0.5 sm:ml-1 text-xs h-5">
            {examQuestions.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 mt-3 sm:mt-4 overflow-hidden">
        <ScrollArea className="h-full">
          <TabsContent value="modules" className="m-0 pr-2">
            {modules.length === 0 ? (
              <EmptyState message="Nenhum módulo foi gerado ainda para este curso." />
            ) : (
              <Accordion type="single" collapsible className="space-y-2">
                {modules.map((module, index) => (
                  <AccordionItem
                    key={index}
                    value={`module-${index}`}
                    className="border rounded-lg px-3 sm:px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Badge variant="outline" className="flex-shrink-0 text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-left font-medium text-sm sm:text-base line-clamp-2">
                          {module.title || `Módulo ${index + 1}`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-2 pb-4">
                        <FormattedContent content={module.content || ''} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="exercises" className="m-0 space-y-3 sm:space-y-4 pr-2">
            {exercises.length === 0 ? (
              <EmptyState message="Nenhum exercício foi gerado ainda para este curso." />
            ) : (
              exercises.map((exercise, index) =>
                renderQuestion(
                  {
                    id: exercise.id,
                    question: exercise.question,
                    options: exercise.options,
                    correct_answer: exercise.correct_answer,
                    order_index: exercise.order_index,
                  },
                  index
                )
              )
            )}
          </TabsContent>

          <TabsContent value="exam" className="m-0 space-y-3 sm:space-y-4 pr-2">
            {examQuestions.length === 0 ? (
              <EmptyState message="Nenhuma questão de prova foi gerada ainda para este curso." />
            ) : (
              examQuestions.map((question, index) =>
                renderQuestion(
                  {
                    id: question.id,
                    question: question.question,
                    options: question.options,
                    correct_answer: question.correct_answer,
                    order_index: question.order_index,
                  },
                  index
                )
              )
            )}
          </TabsContent>
        </ScrollArea>
      </div>
    </Tabs>
  );

  // Mobile: Use Drawer (slides up from bottom)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="flex-shrink-0 pb-2">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{course.title}</span>
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pb-safe">
            <ContentTabs />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <BookOpen className="h-5 w-5" />
            <span className="line-clamp-1">{course.title}</span>
          </DialogTitle>
        </DialogHeader>
        <ContentTabs />
      </DialogContent>
    </Dialog>
  );
}
