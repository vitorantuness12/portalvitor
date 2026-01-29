
## Correções no Verso da Carteirinha

### Problema 1: Logo Achatada
A logo está usando `h-5 w-5` (dimensões quadradas), mas a imagem original é retangular. Isso força a logo a ficar "esmagada".

**Solução**: Remover a largura fixa e usar apenas altura, permitindo que a largura seja proporcional automaticamente.

### Problema 2: Substituir "Formak" por Bandeira do Brasil
O texto "Formak" no rodapé será substituído por uma imagem da bandeira do Brasil.

**Solução**: Usar um emoji de bandeira 🇧🇷 ou uma imagem SVG inline da bandeira brasileira.

### Alterações Técnicas

**Arquivo:** `src/components/studentCard/StudentCardPreview.tsx`

1. **Linha 143-144** - Substituir o footer do verso:

De:
```tsx
<p className="text-sm font-bold text-primary">Formak</p>
<img src={logo} alt="Logo" className="h-5 w-5 object-contain" />
```

Para:
```tsx
{/* Bandeira do Brasil */}
<div className="flex items-center gap-1">
  <svg className="h-4 w-6" viewBox="0 0 36 24" fill="none">
    <rect width="36" height="24" fill="#009739"/>
    <path d="M18 2L34 12L18 22L2 12L18 2Z" fill="#FEDD00"/>
    <circle cx="18" cy="12" r="6" fill="#002776"/>
    <path d="M10 12C10 12 14 15 18 15C22 15 26 12 26 12" stroke="white" strokeWidth="1"/>
  </svg>
</div>
{/* Logo com proporção correta */}
<img src={logo} alt="Logo" className="h-6 object-contain" />
```

### Resultado Esperado
- A logo aparecerá com proporção correta (não mais achatada)
- O texto "Formak" será substituído por uma bandeira do Brasil estilizada
- O layout do rodapé permanece alinhado e visualmente equilibrado
