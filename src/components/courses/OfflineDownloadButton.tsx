import { useState } from 'react';
import { Download, Check, Loader2, Trash2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

interface OfflineDownloadButtonProps {
  isSaved: boolean;
  isSaving: boolean;
  savedAt: string | null;
  onSave: () => Promise<boolean>;
  onRemove: () => Promise<void>;
  /** 0-100 durante o download */
  progress?: number;
  /** Tentativa atual quando há retentativa */
  attempt?: number;
  /** Apenas ícone (usado em listas compactas) */
  compact?: boolean;
  className?: string;
}

export function OfflineDownloadButton({
  isSaved,
  isSaving,
  savedAt,
  onSave,
  onRemove,
  progress = 0,
  attempt = 0,
  compact = false,
  className,
}: OfflineDownloadButtonProps) {
  const { toast } = useToast();
  const online = useOnlineStatus();
  const [removing, setRemoving] = useState(false);


  const handleSave = async () => {
    if (!online) {
      toast({
        title: 'Sem conexão',
        description: 'Conecte-se à internet para baixar o conteúdo do curso.',
        variant: 'destructive',
      });
      return;
    }
    const ok = await onSave();
    toast({
      title: ok ? 'Conteúdo salvo no aparelho' : 'Não foi possível baixar',
      description: ok
        ? 'Agora você pode estudar este curso mesmo sem internet.'
        : 'Verifique sua conexão ou tente novamente mais tarde.',
      variant: ok ? undefined : 'destructive',
    });
  };

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove();
    setRemoving(false);
    toast({
      title: 'Download removido',
      description: 'O conteúdo offline deste curso foi apagado do aparelho.',
    });
  };

  const busy = isSaving || removing;

  if (isSaved) {
    const savedLabel = savedAt
      ? new Date(savedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={compact ? 'icon' : 'sm'}
            disabled={busy}
            className={cn('gap-1.5 text-success border-success/40', className)}
            aria-label="Conteúdo disponível offline"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {!compact && <span>Disponível offline</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {savedLabel && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Baixado em {savedLabel}
            </div>
          )}
          <DropdownMenuItem onClick={handleSave} disabled={!online}>
            <Download className="h-4 w-4" />
            Atualizar conteúdo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRemove} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" />
            Remover download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      onClick={handleSave}
      disabled={busy}
      className={cn('gap-1.5', className)}
      aria-label="Baixar para offline"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : online ? (
        <Download className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {!compact && <span>{busy ? 'Baixando...' : 'Baixar para offline'}</span>}
    </Button>
  );
}
