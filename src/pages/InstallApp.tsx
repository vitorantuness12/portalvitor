import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Share, MoreVertical, Plus } from 'lucide-react';
import logoWhite from '@/assets/logo_formak_white.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl mb-4"
        >
          ✅
        </motion.div>
        <h1 className="text-xl font-bold text-foreground">App instalado!</h1>
        <p className="text-muted-foreground text-sm mt-2 text-center">
          Abra o Formak pela tela inicial do seu dispositivo.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8 safe-area-pt safe-area-pb">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full flex flex-col items-center text-center"
      >
        <img src={logoWhite} alt="Formak" className="h-14 mb-6 dark:block hidden" />
        <img src={logoWhite} alt="Formak" className="h-14 mb-6 dark:hidden block brightness-0" />

        <h1 className="text-2xl font-bold text-foreground mb-2">Instale o App</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Tenha acesso rápido aos seus cursos direto da tela inicial.
        </p>

        {deferredPrompt ? (
          <Button
            onClick={handleInstall}
            className="w-full h-13 rounded-xl text-base font-semibold hero-gradient text-primary-foreground"
          >
            <Download className="h-5 w-5 mr-2" />
            Instalar Formak
          </Button>
        ) : isIOS ? (
          <div className="space-y-4 w-full">
            <div className="flex items-start gap-3 text-left p-4 rounded-xl bg-card border border-border">
              <Share className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">1. Toque em Compartilhar</p>
                <p className="text-xs text-muted-foreground">No Safari, toque no ícone de compartilhar na barra inferior.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left p-4 rounded-xl bg-card border border-border">
              <Plus className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">2. Adicionar à Tela de Início</p>
                <p className="text-xs text-muted-foreground">Role para baixo e toque em "Adicionar à Tela de Início".</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <div className="flex items-start gap-3 text-left p-4 rounded-xl bg-card border border-border">
              <MoreVertical className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">1. Abra o menu do navegador</p>
                <p className="text-xs text-muted-foreground">Toque nos três pontinhos no canto superior.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left p-4 rounded-xl bg-card border border-border">
              <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">2. Instalar aplicativo</p>
                <p className="text-xs text-muted-foreground">Toque em "Instalar aplicativo" ou "Adicionar à tela inicial".</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
