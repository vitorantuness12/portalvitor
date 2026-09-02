import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Share, MoreVertical, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoWhite from '@/assets/logo_formak_white.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

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
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
    setInstalling(false);
  };

  if (installed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success mb-5"
        >
          <CheckCircle2 className="h-10 w-10" strokeWidth={1.75} />
        </motion.div>
        <h1 className="text-xl font-display font-bold text-foreground">App instalado!</h1>
        <p className="text-muted-foreground text-sm mt-2 text-center max-w-xs">
          Abra o Formak pela tela inicial do seu dispositivo para começar a estudar.
        </p>
      </div>
    );
  }

  const steps = isIOS
    ? [
        {
          icon: Share,
          title: 'Toque em Compartilhar',
          description: 'No Safari, toque no ícone de compartilhar na barra inferior da tela.',
        },
        {
          icon: Plus,
          title: 'Adicionar à Tela de Início',
          description: 'Role para baixo e toque em "Adicionar à Tela de Início".',
        },
      ]
    : [
        {
          icon: MoreVertical,
          title: 'Abra o menu do navegador',
          description: 'Toque nos três pontinhos no canto superior direito.',
        },
        {
          icon: Download,
          title: 'Instalar aplicativo',
          description: 'Toque em "Instalar aplicativo" ou "Adicionar à tela inicial".',
        },
      ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 safe-area-pt safe-area-pb">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm w-full flex flex-col items-center text-center"
      >
        <img src={logoWhite} alt="Formak" className="h-14 mb-6 dark:block hidden" />
        <img src={logoWhite} alt="Formak" className="h-14 mb-6 dark:hidden block brightness-0" />

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Instale o app</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Tenha acesso rápido aos seus cursos direto da tela inicial, como um aplicativo nativo.
        </p>

        {deferredPrompt ? (
          <Button
            onClick={handleInstall}
            disabled={installing}
            variant="hero"
            size="lg"
            block
          >
            <Download className="h-5 w-5" />
            {installing ? 'Instalando...' : 'Instalar Formak'}
          </Button>
        ) : (
          <div className="space-y-3 w-full">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1, duration: 0.35 }}
                className="flex items-center gap-4 text-left p-4 rounded-2xl bg-card border border-border shadow-soft"
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="h-5 w-5" strokeWidth={1.75} />
                  <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-display font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
