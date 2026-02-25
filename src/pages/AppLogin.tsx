import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import iconeApp from '@/assets/icone_app.png';
import logoFormak from '@/assets/logo_formak.png';

export default function AppLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: 'Email ou senha incorretos.',
        variant: 'destructive',
      });
    } else {
      navigate('/meus-cursos');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1424] safe-area-pt safe-area-pb relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/15 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], x: [0, -10, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            className="absolute inset-0 flex items-center justify-center z-50 bg-[#0d1424]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div className="flex flex-col items-center gap-6">
              <motion.img
                src={iconeApp}
                alt="Formak"
                className="w-28 h-28 rounded-3xl shadow-2xl shadow-primary/30"
                initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                onAnimationComplete={() => {
                  setTimeout(() => setShowSplash(false), 800);
                }}
              />
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span className="text-2xl font-bold text-white tracking-tight">Formak</span>
                <motion.div
                  className="h-0.5 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: 60 }}
                  transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center"
          >
            {/* Icon + Logo */}
            <motion.img
              src={iconeApp}
              alt="Formak"
              className="w-20 h-20 rounded-2xl shadow-lg shadow-primary/20 mb-3"
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />

            <motion.img
              src={logoFormak}
              alt="Formak"
              className="h-8 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            />

            <motion.p
              className="text-white/50 text-sm mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              Acesse sua conta
            </motion.p>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="w-full space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-13 rounded-xl text-base px-4 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="h-13 rounded-xl text-base px-4 pr-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/50 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-13 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
              </Button>
            </motion.form>

            {/* Links */}
            <motion.div
              className="mt-8 flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <button
                onClick={() => navigate('/auth')}
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Esqueceu a senha?
              </button>
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Criar uma conta
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
