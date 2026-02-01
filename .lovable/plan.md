

## Adicionar Seletor de Modelo OpenAI no Painel Admin

### Objetivo
Permitir que o administrador escolha qual modelo da OpenAI usar para gerar cursos (gpt-4o-mini ou gpt-4o), oferecendo flexibilidade entre velocidade/custo e qualidade/capacidade.

### Por que isso e importante?
- **gpt-4o-mini**: Mais rapido e barato, mas limitado a 16.384 tokens de saida
- **gpt-4o**: Mais caro, porem suporta 128k tokens de contexto e gera conteudo mais extenso e de maior qualidade

### Arquivos a Criar/Modificar

**1. Banco de Dados - Nova Tabela**
```sql
CREATE TABLE ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openai_model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Inserir configuracao padrao
INSERT INTO ai_config (openai_model) VALUES ('gpt-4o-mini');
```

**2. Frontend - Modificar CreateCourseAI.tsx e BulkCreateCourseAI.tsx**
Adicionar um Select para escolher o modelo de IA:
```text
+-------------------------------------+
| Modelo de IA                        |
+-------------------------------------+
| gpt-4o-mini (Rapido, Economico)     | <- Padrao
| gpt-4o (Avancado, Mais Tokens)      |
+-------------------------------------+
```

- O modelo selecionado sera enviado no body da requisicao para as Edge Functions
- Exibir aviso de que gpt-4o pode demorar mais e custar mais

**3. Backend - Modificar generate-course/index.ts**
- Receber o parametro `openaiModel` no request body
- Usar o modelo selecionado nas chamadas a API da OpenAI
- Ajustar `maxTokens` dinamicamente baseado no modelo:
  - gpt-4o-mini: max 16.000 tokens
  - gpt-4o: max 64.000 tokens (permitindo conteudo muito mais extenso)

**4. Backend - Modificar generate-course-bulk/index.ts**
- Mesmas alteracoes do generate-course

### Interface Visual Proposta

```text
+------------------------------------------+
|            Configurar Curso              |
+------------------------------------------+
| Tema do Curso *                          |
| [________________________________]       |
|                                          |
| Nivel           | Carga Horaria          |
| [Iniciante   v] | [10 horas         v]   |
|                                          |
| Modelo de IA                             |
| [gpt-4o-mini (Rapido)            v]      |
| i Modelos mais avancados geram           |
|   conteudo de maior qualidade mas        |
|   podem demorar mais.                    |
|                                          |
| Profundidade do Conteudo                 |
| [Detalhado (~1000 palavras)      v]      |
+------------------------------------------+
```

### Detalhes Tecnicos

**Parametros por Modelo:**

| Modelo | Max Tokens | Custo | Velocidade | Uso Recomendado |
|--------|------------|-------|------------|-----------------|
| gpt-4o-mini | 16.384 | $ | Rapido | Cursos basicos a extensos |
| gpt-4o | 128.000 | $$$$ | Lento | Enciclopedico, alta qualidade |

**Ajuste de Profundidade para gpt-4o:**
```typescript
const depthConfig = {
  basico: { minWords: 500, maxTokens: 8000 },
  detalhado: { minWords: 1000, maxTokens: 12000 },
  extenso: { minWords: 2000, maxTokens: 20000 },
  muito_extenso: { minWords: 3000, maxTokens: 30000 },
  profissional: { minWords: 4000, maxTokens: 40000 },
  enciclopedico: { minWords: 5000, maxTokens: 60000 }
};
```

### Fluxo de Dados

```text
Admin Interface
     |
     | seleciona modelo: "gpt-4o"
     v
+-------------------+
| CreateCourseAI.tsx|
+-------------------+
     |
     | POST { topic, ..., openaiModel: "gpt-4o" }
     v
+-------------------+
| Edge Function     |
| generate-course   |
+-------------------+
     |
     | fetch OpenAI API com model: "gpt-4o"
     v
+-------------------+
| OpenAI API        |
+-------------------+
```

### Consideracoes de Seguranca
- Apenas administradores podem alterar o modelo
- O modelo e validado no backend para evitar valores invalidos
- Modelos permitidos: ["gpt-4o-mini", "gpt-4o"]

