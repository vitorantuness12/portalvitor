
# Ajustes na Tela de Login PWA

## Alteracoes

### 1. Trocar logo para a versao laranja (`src/pages/AppLogin.tsx`)
- Substituir o import de `logo_formak_white.png` por `logo_formak.png` (versao laranja/colorida)
- Simplificar para usar uma unica tag `<img>` sem logica dark/light, ja que a logo laranja funciona em ambos os temas

### 2. Redirecionar para `/meus-cursos` apos login (`src/pages/AppLogin.tsx`)
- Alterar o `navigate('/')` no sucesso do login para `navigate('/meus-cursos')`
