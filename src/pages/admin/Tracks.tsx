import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Layers, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminTrack {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  is_active: boolean;
  track_courses: { course_id: string; position: number }[];
}

const emptyForm = {
  id: '',
  title: '',
  slug: '',
  description: '',
  price: '',
  original_price: '',
  is_active: true,
  courseIds: [] as string[],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminTracks() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['admin-tracks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_tracks')
        .select('id, title, slug, description, price, original_price, is_active, track_courses (course_id, position)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminTrack[];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ['admin-tracks-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, price')
        .eq('status', 'active')
        .order('title');
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        slug: (form.slug.trim() || slugify(form.title)).toLowerCase(),
        description: form.description.trim() || null,
        price: Number(form.price) || 0,
        original_price: form.original_price ? Number(form.original_price) : null,
        is_active: form.is_active,
      };

      if (!payload.title) throw new Error('Informe o título da trilha');
      if (!form.courseIds.length) throw new Error('Selecione ao menos um curso');

      let trackId = form.id;

      if (trackId) {
        const { error } = await supabase.from('learning_tracks').update(payload).eq('id', trackId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('learning_tracks')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        trackId = data.id;
      }

      // Substitui a composição da trilha mantendo a ordem escolhida.
      const { error: deleteError } = await supabase
        .from('track_courses')
        .delete()
        .eq('track_id', trackId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from('track_courses').insert(
        form.courseIds.map((courseId, index) => ({
          track_id: trackId,
          course_id: courseId,
          position: index,
        })),
      );
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success('Trilha salva com sucesso');
      setOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('learning_tracks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trilha removida');
      queryClient.invalidateQueries({ queryKey: ['admin-tracks'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openEdit = (track: AdminTrack) => {
    setForm({
      id: track.id,
      title: track.title,
      slug: track.slug,
      description: track.description ?? '',
      price: String(track.price ?? ''),
      original_price: track.original_price ? String(track.original_price) : '',
      is_active: track.is_active,
      courseIds: track.track_courses
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((tc) => tc.course_id),
    });
    setOpen(true);
  };

  const toggleCourse = (courseId: string) => {
    setForm((prev) => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const selectedSum = (courses ?? [])
    .filter((c) => form.courseIds.includes(c.id))
    .reduce((acc, c) => acc + Number(c.price || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trilhas"
        title="Trilhas de carreira"
        description="Combos de cursos com preço promocional e certificado próprio."
        actions={
          <Button
            onClick={() => {
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova trilha
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : !tracks?.length ? (
        <EmptyState icon={Layers} title="Nenhuma trilha criada" description="Crie a primeira trilha de carreira." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tracks.map((track) => (
            <Card key={track.id} className="rounded-2xl">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display font-bold">{track.title}</h3>
                    <p className="text-xs text-muted-foreground">/trilha/{track.slug}</p>
                  </div>
                  <Badge variant={track.is_active ? 'default' : 'secondary'}>
                    {track.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-primary">
                    R$ {Number(track.price).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-muted-foreground">
                    {track.track_courses?.length ?? 0} cursos
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(track)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`Remover a trilha "${track.title}"?`)) remove.mutate(track.id);
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar trilha' : 'Nova trilha'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                    slug: prev.id ? prev.slug : slugify(e.target.value),
                  }))
                }
                placeholder="Trilha Gastronomia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Preço da trilha (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="original_price">Preço "de" (opcional)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.original_price}
                  onChange={(e) => setForm((prev) => ({ ...prev, original_price: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <Label htmlFor="is_active">Trilha ativa</Label>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cursos da trilha ({form.courseIds.length})</Label>
                <span className="text-xs text-muted-foreground">
                  Soma avulsa: R$ {selectedSum.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                {(courses ?? []).map((course) => (
                  <label
                    key={course.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
                  >
                    <Checkbox
                      checked={form.courseIds.includes(course.id)}
                      onCheckedChange={() => toggleCourse(course.id)}
                    />
                    <span className="flex-1 truncate text-sm">{course.title}</span>
                    <span className="text-xs text-muted-foreground">
                      R$ {Number(course.price).toFixed(2).replace('.', ',')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar trilha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
