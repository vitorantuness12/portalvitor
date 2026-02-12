
## Corrigir erro "unsupported number" na geracao de PDF

### Problema
O erro `unsupported number: -1.9257742442982246e+21` ocorre no `@react-pdf/renderer` durante o `renderText` / `translate`. Isso e um bug conhecido da biblioteca causado por combinacoes de estilos que fazem o motor de layout calcular coordenadas invalidas.

### Causa raiz
Tres problemas no `CoursePdfDocument.tsx`:
1. **`maxWidth: 400`** na descricao da capa - causa calculo de posicao invalido quando combinado com `alignItems: 'center'`
2. **`lineHeight` decimal** (1.6 e 1.7) - em algumas versoes do react-pdf, valores decimais de lineHeight causam overflow numerico em textos longos
3. **Textos muito longos em um unico `<Text>`** - paragrafos extensos podem estourar o calculo de layout

### Solucao

Editar `src/components/courses/CoursePdfDocument.tsx`:

1. **Remover `maxWidth: 400`** do estilo `coverDescription` - substituir por padding lateral na pagina de capa
2. **Trocar `lineHeight` decimal por valores inteiros** - usar `lineHeight: 2` em vez de `1.7`, ou remover completamente e usar `marginBottom` entre paragrafos para espacamento
3. **Limitar tamanho dos paragrafos** - na funcao `splitIntoParagraphs`, quebrar textos maiores que ~500 caracteres em pedacos menores para evitar overflow no layout engine
4. **Remover `alignItems: 'center'`** da capa e usar `textAlign: 'center'` nos textos individualmente - evita calculo de posicionamento complexo pelo layout engine

### Detalhes tecnicos

```text
Estilos problematicos         ->  Correcao
------------------------------------------------------
maxWidth: 400                 ->  Remover, usar padding
lineHeight: 1.6 / 1.7        ->  Remover, usar marginBottom
alignItems: 'center' (capa)  ->  textAlign: 'center' nos Text
```

A funcao `splitIntoParagraphs` sera atualizada para tambem quebrar paragrafos individuais muito longos (>500 chars) em pedacos menores, evitando que o motor de layout tente renderizar blocos de texto enormes.

Apenas o arquivo `src/components/courses/CoursePdfDocument.tsx` sera editado.
