
# PWA com Tela de Login Nativa

## Objetivo
Transformar o app em um PWA instalavel e criar uma tela de login exclusiva com visual de app nativo, que aparece apenas quando o usuario acessa via PWA.

## O que sera feito

### 1. Configurar o PWA
- Instalar o plugin `vite-plugin-pwa`
- Configurar o `vite.config.ts` com manifest, icones, service worker e cores da Formak
- Adicionar meta tags para mobile no `index.html` (theme-color, apple-mobile-web-app, etc.)
- Bloquear cache do service worker na rota `/~oauth`

### 2. Criar a tela de login exclusiva para PWA
Uma nova pagina `/app-login` com design de app nativo:
- Tela cheia, sem header/footer
- Logo grande centralizada no topo
- Campos de email e senha com estilo arredondado e grande (touch-friendly)
- Botao de login com gradiente da marca, ocupando toda a largura
- Link para cadastro que redireciona ao `/auth?mode=signup`
- Animacoes suaves de entrada (framer-motion)
- Safe area insets para dispositivos com notch
- Visual minimalista e limpo, fundo escuro com gradiente sutil

### 3. Detectar modo PWA e redirecionar
- Criar um hook `useIsPwa()` que detecta se o app esta rodando como PWA (via `display-mode: standalone` ou `navigator.standalone`)
- No `App.tsx`, adicionar a rota `/app-login`
- No fluxo de autenticacao, quando o usuario nao estiver logado e estiver em modo PWA, redirecionar para `/app-login` ao inves de `/auth`

### 4. Pagina de instalacao `/install`
- Criar pagina simples com instrucoes para instalar o app
- Botao para disparar o prompt de instalacao (evento `beforeinstallprompt`)

---

## Detalhes tecnicos

**Arquivos novos:**
- `src/pages/AppLogin.tsx` - Tela de login estilo app nativo
- `src/pages/InstallApp.tsx` - Pagina de instalacao do PWA
- `src/hooks/useIsPwa.ts` - Hook para detectar modo standalone

**Arquivos modificados:**
- `vite.config.ts` - Adicionar plugin PWA com manifest
- `index.html` - Meta tags para mobile (theme-color, apple-mobile-web-app-capable, viewport)
- `src/App.tsx` - Adicionar rotas `/app-login` e `/install`
- `package.json` - Adicionar dependencia `vite-plugin-pwa`

**Manifest do PWA:**
- Nome: Formak
- Start URL: `/app-login`
- Display: standalone
- Theme color e background color com as cores da marca
- Icone usando o favicon atual
