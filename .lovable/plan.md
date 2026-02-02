
## Aumentar Limite de Tokens para 60k-80k com Modelos O1/O3

### Objetivo
Aproveitar os limites superiores de tokens dos modelos de raciocínio (o1, o1-mini, o3-mini) para gerar cursos com conteúdo muito mais extenso em uma única requisição, eliminando a necessidade de geração módulo por módulo.

### Limites de Tokens por Modelo

| Modelo | Tokens de Saída | Uso Recomendado |
|--------|-----------------|-----------------|
| gpt-4o-mini | 16.384 | Cursos básicos/detalhados |
| gpt-4o | 16.384 | Cursos básicos/detalhados |
| o1-mini | 65.536 | Cursos extensos/profissionais |
| o1 | 100.000 | Cursos enciclopédicos |
| o3-mini | 100.000 | Cursos enciclopédicos |

### Arquivos a Modificar

**1. supabase/functions/generate-course/index.ts**

Atualizar a configuração de profundidade para usar tokens mais altos nos modelos O1/O3:

```typescript
// Configuração dinâmica baseada no modelo
const getDepthConfig = (model: string) => {
  const isHighTokenModel = model?.startsWith("o1") || model?.startsWith("o3");
  
  if (isHighTokenModel) {
    // Modelos O1/O3 suportam muito mais tokens
    return {
      basico: { minWords: 500, maxTokens: 12000 },
      detalhado: { minWords: 1500, maxTokens: 20000 },
      extenso: { minWords: 3000, maxTokens: 35000 },
      muito_extenso: { minWords: 5000, maxTokens: 50000 },
      profissional: { minWords: 7000, maxTokens: 65000 },
      enciclopedico: { minWords: 10000, maxTokens: 80000 }
    };
  }
  
  // Modelos GPT-4o limitados a 16k
  return {
    basico: { minWords: 500, maxTokens: 8000 },
    detalhado: { minWords: 1000, maxTokens: 12000 },
    extenso: { minWords: 2000, maxTokens: 16000 },
    muito_extenso: { minWords: 3000, maxTokens: 16000 },
    profissional: { minWords: 4000, maxTokens: 16000 },
    enciclopedico: { minWords: 5000, maxTokens: 16000 }
  };
};
```

**2. supabase/functions/generate-course-bulk/index.ts**

Aplicar a mesma lógica de configuração dinâmica.

**3. src/pages/admin/CreateCourseAI.tsx**

Atualizar o seletor de modelos para mostrar os limites de tokens:

```text
+------------------------------------------+
| Modelo de IA                             |
+------------------------------------------+
| gpt-4o-mini (Rápido, até 16k tokens)     |
| gpt-4o (Avançado, até 16k tokens)        |
| o1-mini (Raciocínio, até 65k tokens) ⭐  |
| o1 (Raciocínio Avançado, até 100k)       |
| o3-mini (Mais Recente, até 100k) ⭐      |
+------------------------------------------+
```

Adicionar aviso informativo:
```
ℹ️ Modelos O1/O3 permitem gerar conteúdo muito mais 
   extenso (até 10.000 palavras por módulo) em uma 
   única requisição.
```

**4. Atualizar profundidades no frontend**

Quando o usuário selecionar o1/o3, mostrar opções de profundidade com mais palavras:

```text
Para gpt-4o-mini/gpt-4o:
- Básico (~500 palavras/módulo)
- Detalhado (~1.000 palavras/módulo)
- Extenso (~2.000 palavras/módulo)

Para o1/o1-mini/o3-mini:
- Básico (~500 palavras/módulo)
- Detalhado (~1.500 palavras/módulo)
- Extenso (~3.000 palavras/módulo)
- Muito Extenso (~5.000 palavras/módulo)
- Profissional (~7.000 palavras/módulo)
- Enciclopédico (~10.000 palavras/módulo) ⭐
```

### Prompt Atualizado

Adicionar instrução para não truncar:

```
IMPORTANTE: Você tem tokens suficientes para gerar conteúdo COMPLETO.
NÃO adicione notas como "versão reduzida", "seria necessário detalhar".
Gere o conteúdo COMPLETO sem truncamento.
```

### Fluxo de Dados

```text
Admin seleciona:
  - Modelo: o3-mini
  - Profundidade: Enciclopédico
           │
           ▼
┌─────────────────────────────────┐
│ Edge Function                    │
│ maxTokens = 80.000              │
│ minWords = 10.000 por módulo    │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ OpenAI API (o3-mini)            │
│ max_completion_tokens: 80000    │
│ Gera ~60.000 palavras           │
└─────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│ Curso Completo                  │
│ 8 módulos x 7.500 palavras      │
│ = ~60.000 palavras total        │
└─────────────────────────────────┘
```

### Estimativa de Conteúdo por Configuração

| Modelo + Profundidade | Tokens | Palavras | Módulos (8) |
|----------------------|--------|----------|-------------|
| GPT-4o + Detalhado | 12k | ~9.000 | ~1.125 cada |
| GPT-4o + Extenso | 16k | ~12.000 | ~1.500 cada |
| O3-mini + Extenso | 35k | ~26.000 | ~3.250 cada |
| O3-mini + Profissional | 65k | ~48.000 | ~6.000 cada |
| O3-mini + Enciclopédico | 80k | ~60.000 | ~7.500 cada |

### Considerações de Custo

Os modelos O1/O3 são mais caros que GPT-4o:

| Modelo | Custo por 1M tokens (input) | Custo por 1M tokens (output) |
|--------|----------------------------|------------------------------|
| gpt-4o-mini | $0.15 | $0.60 |
| gpt-4o | $2.50 | $10.00 |
| o1-mini | $3.00 | $12.00 |
| o3-mini | $1.10 | $4.40 |
| o1 | $15.00 | $60.00 |

Recomendação: **o3-mini** oferece o melhor custo-benefício para conteúdo extenso.

### Resumo das Alterações

1. **Edge Functions**: Configuração dinâmica de tokens baseada no modelo selecionado
2. **Frontend**: Atualizar labels dos modelos mostrando limites de tokens
3. **Profundidades**: Aumentar limites de palavras para modelos O1/O3
4. **Prompts**: Adicionar instrução explícita para não truncar conteúdo
