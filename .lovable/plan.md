

## Solucao definitiva: Substituir @react-pdf/renderer por jsPDF

### Problema raiz

O `@react-pdf/renderer` tem um bug conhecido com textos longos - ele causa erro `unsupported number` quando o motor de layout tenta calcular posicoes para grandes volumes de texto. Os modulos deste curso tem entre 23.000 e 28.000 caracteres cada, totalizando mais de 200.000 caracteres. Nenhum ajuste de estilo resolve isso - e uma limitacao fundamental da biblioteca.

Depois de 4 tentativas de corrigir via estilos, a unica solucao e trocar a biblioteca.

### Solucao

Substituir `@react-pdf/renderer` pela biblioteca `jsPDF`, que e leve (~150KB), estavel com grandes volumes de texto e gera PDFs diretamente no navegador sem motor de layout complexo.

### O que sera feito

1. **Instalar `jspdf`** como dependencia do projeto

2. **Reescrever `CoursePdfDocument.tsx`** - Substituir o componente React por uma funcao utilitaria `generateCoursePdf()` que usa jsPDF para:
   - Criar pagina de capa com titulo, descricao, nivel, duracao e numero de modulos
   - Gerar paginas de conteudo para cada modulo com quebra automatica de texto
   - Adicionar cabecalho com titulo do curso e numeracao de paginas
   - Limpar markdown do conteudo antes de renderizar

3. **Atualizar `CourseDownloadActions.tsx`** - Trocar a chamada de `pdf().toBlob()` do react-pdf pela nova funcao `generateCoursePdf()` que retorna o blob do jsPDF

4. **Remover `@react-pdf/renderer`** das dependencias (se nao for usado em outros lugares do projeto)

### Detalhes tecnicos

A nova funcao tera esta estrutura:

```text
generateCoursePdf(props) -> Blob
  1. Criar instancia jsPDF (A4, portrait)
  2. Renderizar capa (titulo centralizado, linha divisoria, meta dados)
  3. Para cada modulo:
     - Limpar markdown do conteudo
     - Usar doc.text() com splitTextToSize() para quebra automatica
     - Adicionar novas paginas automaticamente quando o texto ultrapassar a margem inferior
     - Adicionar cabecalho e numero de pagina em cada pagina
  4. Retornar doc.output('blob')
```

O jsPDF lida nativamente com textos de qualquer tamanho sem problemas de layout, pois nao usa motor de layout flexbox como o react-pdf.

### Arquivos afetados

- `src/components/courses/CoursePdfDocument.tsx` - Reescrito como funcao utilitaria
- `src/components/courses/CourseDownloadActions.tsx` - Atualizado para usar nova funcao
- `package.json` - Adicionar jspdf, verificar se react-pdf pode ser removido

