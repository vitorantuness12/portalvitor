
## Correção do Nome Cortado na Carteirinha

### Problema Identificado
O nome do estudante está aparecendo com uma **linha horizontal** atravessando o texto (como um "strikethrough"). Isso acontece porque o `html2canvas` não suporta corretamente as propriedades CSS `-webkit-line-clamp` e `-webkit-box-orient` usadas para limitar o texto a 2 linhas.

### Solução
Remover completamente o sistema de "line clamp" e usar uma abordagem mais simples que seja compatível com `html2canvas`:
- Usar `word-break: break-word` para quebrar palavras longas
- Limitar apenas com `max-height` se necessário
- Remover todas as propriedades `-webkit` que causam o problema

### Alterações Técnicas

**Arquivo:** `src/components/studentCard/StudentCardPreview.tsx`

1. **Remover o `nameStyle` problemático** (linhas 48-56)
   - Excluir as propriedades `display: -webkit-box`, `WebkitLineClamp`, `WebkitBoxOrient`

2. **Substituir por estilo simples e compatível**
   - Usar apenas `overflow: hidden` e `wordBreak: break-word`
   - Opcionalmente, limitar altura máxima para 2 linhas de forma segura

3. **Alternativa: usar abordagem híbrida**
   - No modo `exportMode`, usar estilo simplificado
   - No preview normal, manter o line-clamp para visual melhor

### Código Proposto

Trocar o `nameStyle` atual por:
```typescript
const nameStyle: React.CSSProperties = {
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  lineHeight: '1.2',
};
```

### Resultado Esperado
- O nome do estudante será exibido **sem a linha cortando**
- Nomes longos vão quebrar em múltiplas linhas naturalmente
- Preview e PNG ficarão idênticos e corretos
