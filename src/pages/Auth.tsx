import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck, Infinity as InfinityIcon, Award, Users } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneBR, unformatPhone, isValidPhoneBR } from '@/lib/masks';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/icone_formak.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  whatsapp: z.string().refine((val) => isValidPhoneBR(val), {
    message: 'WhatsApp inválido. Use o formato (99) 99999-9999',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

const brandHighlights = [
  { icon: Award, text: 'Certificado reconhecido ao concluir cada curso' },
  { icon: InfinityIcon, text: 'Acesso vitalício ao conteúdo adquirido' },
  { icon: Users, text: 'Comunidade e suporte para tirar dúvidas' },
  { icon: ShieldCheck, text: 'Compra 100% segura e protegida' },
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get('mode') === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    whatsapp: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/meus-cursos');
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Apply mask for WhatsApp field
    if (name === 'whatsapp') {
      setFormData((prev) => ({ ...prev, [name]: formatPhoneBR(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isSignup) {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName, unformatPhone(formData.whatsapp));
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Email já cadastrado',
              description: 'Este email já está em uso. Tente fazer login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao criar conta',
              description: error.message,
              variant: 'destructive',
            });
          }
          setLoading(false);
          return;
        }

        toast({
          title: 'Conta criada com sucesso!',
          description: 'Vamos personalizar sua experiência.',
        });
        navigate('/onboarding');
      } else {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Credenciais inválidas',
              description: 'Email ou senha incorretos.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erro ao entrar',
              description: error.message,
              variant: 'destructive',
            });
          }
          setLoading(false);
          return;
        }

        toast({
          title: 'Bem-vindo de volta!',
          description: 'Login realizado com sucesso.',
        });

        // Check if user completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (profile && !profile.onboarding_completed) {
          navigate('/onboarding');
        } else {
          navigate('/meus-cursos');
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 focus-ring rounded-md">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>

          <div className="flex items-center gap-2 mb-10">
            <img src={logo} alt="Formak" className="h-10 w-10 object-contain" />
            <span className="text-xl font-display font-bold">Formak</span>
          </div>

          {/* Segmented toggle */}
          <div className="relative grid grid-cols-2 rounded-xl bg-muted p-1 mb-8" role="tablist" aria-label="Entrar ou cadastrar">
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              onClick={() => setIsSignup(false)}
              className={cn(
                'relative z-10 h-10 rounded-lg text-sm font-semibold font-display transition-colors focus-ring',
                !isSignup ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              onClick={() => setIsSignup(true)}
              className={cn(
                'relative z-10 h-10 rounded-lg text-sm font-semibold font-display transition-colors focus-ring',
                isSignup ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Cadastrar
            </button>
            <motion.div
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-primary shadow-soft"
              animate={{ x: isSignup ? '100%' : '0%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              style={{ left: 4 }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignup ? 'signup' : 'login'}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="text-2xl font-display font-bold mb-2">
                {isSignup ? 'Crie sua conta' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-muted-foreground mb-8">
                {isSignup
                  ? 'Cadastre-se e comece a aprender hoje mesmo'
                  : 'Entre para acessar seus cursos'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome completo</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      aria-invalid={!!errors.fullName}
                      autoComplete="name"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      placeholder="(99) 99999-9999"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      aria-invalid={!!errors.whatsapp}
                      autoComplete="tel"
                    />
                    {errors.whatsapp && (
                      <p className="text-sm text-destructive">{errors.whatsapp}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    aria-invalid={!!errors.email}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      aria-invalid={!!errors.password}
                      autoComplete={isSignup ? 'new-password' : 'current-password'}
                      className="pr-11"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-muted-foreground hover:text-foreground focus-ring rounded-r-xl"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {isSignup && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar senha</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      aria-invalid={!!errors.confirmPassword}
                      autoComplete="new-password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <Button type="submit" variant="hero" block size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isSignup ? 'Criando conta...' : 'Entrando...'}
                    </>
                  ) : isSignup ? (
                    'Criar conta'
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-sm text-muted-foreground hover:text-foreground focus-ring rounded-md"
                >
                  {isSignup ? (
                    <>
                      Já tem uma conta?{' '}
                      <span className="font-semibold text-primary">Entrar</span>
                    </>
                  ) : (
                    <>
                      Não tem uma conta?{' '}
                      <span className="font-semibold text-primary">Cadastre-se</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel - Brand composition */}
      <div className="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden hero-gradient">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-md px-12 text-primary-foreground"
        >
          <h3 className="text-3xl font-display font-bold mb-4 text-balance">
            Aprenda com os melhores
          </h3>
          <p className="text-base opacity-90 mb-10">
            Cursos desenvolvidos por especialistas, com certificado reconhecido e acesso vitalício.
          </p>

          <ul className="space-y-4">
            {brandHighlights.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-sm leading-relaxed opacity-95 pt-1.5">{text}</span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-12 flex items-center gap-3 rounded-2xl bg-primary-foreground/10 p-4">
            <div className="flex -space-x-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-primary-foreground/40 bg-primary-foreground/25"
                />
              ))}
            </div>
            <p className="text-xs leading-snug opacity-90">
              Milhares de alunos já transformaram suas carreiras com a Formak.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
