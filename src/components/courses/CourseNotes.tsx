import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Save, X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CourseNotesProps {
  courseId: string;
  enrollmentId: string;
  userId: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function CourseNotes({ courseId, enrollmentId, userId }: CourseNotesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editNote, setEditNote] = useState({ title: '', content: '' });

  // Fetch notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['course-notes', courseId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_notes')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Note[];
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (note: { title: string; content: string }) => {
      const { error } = await supabase
        .from('course_notes')
        .insert({
          user_id: userId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          title: note.title,
          content: note.content,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId, userId] });
      setIsCreating(false);
      setNewNote({ title: '', content: '' });
      toast({
        title: 'Nota criada!',
        description: 'Sua nota foi salva com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao criar nota',
        description: 'Não foi possível salvar sua nota. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { error } = await supabase
        .from('course_notes')
        .update({ title, content })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId, userId] });
      setEditingId(null);
      toast({
        title: 'Nota atualizada!',
        description: 'Sua nota foi atualizada com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao atualizar nota',
        description: 'Não foi possível atualizar sua nota. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-notes', courseId, userId] });
      toast({
        title: 'Nota excluída!',
        description: 'Sua nota foi excluída com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro ao excluir nota',
        description: 'Não foi possível excluir sua nota. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Título e conteúdo são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    createNoteMutation.mutate(newNote);
  };

  const handleUpdate = (id: string) => {
    if (!editNote.title.trim() || !editNote.content.trim()) {
      toast({
        title: 'Preencha todos os campos',
        description: 'Título e conteúdo são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    updateNoteMutation.mutate({ id, ...editNote });
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditNote({ title: note.title, content: note.content });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Note Button */}
      {!isCreating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button 
            onClick={() => setIsCreating(true)}
            variant="outline"
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Nota
          </Button>
        </motion.div>
      )}

      {/* Create Note Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <Input
                  placeholder="Título da nota..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="text-lg font-semibold"
                  maxLength={100}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Escreva sua nota aqui..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={5}
                  maxLength={5000}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setNewNote({ title: '', content: '' });
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={createNoteMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes List */}
      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                {editingId === note.id ? (
                  <>
                    <CardHeader className="pb-3">
                      <Input
                        value={editNote.title}
                        onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                        className="text-lg font-semibold"
                        maxLength={100}
                      />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={editNote.content}
                        onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                        rows={5}
                        maxLength={5000}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(note.id)}
                          disabled={updateNoteMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{note.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            Atualizado em {format(new Date(note.updated_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditing(note)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            disabled={deleteNoteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {note.content}
                      </p>
                    </CardContent>
                  </>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      ) : !isCreating && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Você ainda não tem notas neste curso.</p>
            <p className="text-sm mt-1">Crie sua primeira nota para organizar seus estudos!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
