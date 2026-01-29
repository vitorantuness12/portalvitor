
## Plano: Mudar Download da Carteirinha de PNG para JPG

### O que será feito
Alterar o formato de download da carteirinha de estudante de PNG para JPG, o que pode resultar em arquivos menores e potencialmente melhor renderização em alguns dispositivos.

### Alterações Técnicas

**Arquivo: `src/pages/StudentCard.tsx`**

Na função `downloadCardSidePng` (que será renomeada para `downloadCardSideJpg`):

1. Alterar o nome do arquivo gerado de `.png` para `.jpg`
2. Mudar o `canvas.toDataURL('image/png')` para `canvas.toDataURL('image/jpeg', 0.95)`
   - O segundo parâmetro (0.95) define a qualidade da imagem (95% - alta qualidade)
3. Adicionar `backgroundColor: '#ffffff'` no html2canvas, pois JPG não suporta transparência

### Diferenças entre PNG e JPG

| Característica | PNG | JPG |
|----------------|-----|-----|
| Transparência | Suporta | Não suporta |
| Tamanho arquivo | Maior | Menor |
| Qualidade | Sem perda | Com perda (configurável) |
| Melhor para | Gráficos/texto | Fotos |

### Resultado Esperado
Os botões "Baixar Frente" e "Baixar Verso" passarão a gerar arquivos `.jpg` com fundo branco sólido e alta qualidade (95%).
