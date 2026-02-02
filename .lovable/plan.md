

## Plano de Correção: Geração de Conteúdo por Módulo

### Problema Identificado

A investigação revelou que **7 dos 8 módulos** do curso criado contêm apenas texto de placeholder (`"CONTEÚDO DO MÓDULO X COM MÍNIMO DE 7000 PALAVRAS..."`) em vez de conteúdo real. Apenas o módulo 1 foi gerado completamente.

**Causa raiz**: Mesmo com limite de 65.000 tokens de saída configurado para o modelo O1, a API da OpenAI não consegue gerar ~56.000 palavras (8 módulos x 7.000 palavras) em uma única requisição. O modelo "economiza" tokens preenchendo os módulos restantes com placeholders.

**Dados do banco confirmam o problema:**
```
Módulo 1: Conteúdo real ✓
Módulo 2-8: "CONTEÚDO DO MÓDULO X COM MÍNIMO DE 7000 PALAVRAS..." ✗
```

### Solução Proposta

Implementar **geração módulo por módulo** para modelos O1/O3 com profundidades extensas, garantindo que cada módulo receba uma chamada dedicada à API.

### Alterações Necessárias

**1. Edge Function (`supabase/functions/generate-course/index.ts`)**

Modificar a lógica de geração de conteúdo para:

a) **Detectar quando usar geração sequencial**:
   - Modelos O1/O3 COM profundidade `muito_extenso`, `profissional` ou `enciclopedico`
   - Cursos com 5+ módulos

b) **Fluxo de geração em duas etapas**:
   
   **Etapa 1 - Gerar estrutura do curso**:
   - Gerar apenas títulos, subtítulo e descrição
   - Definir títulos dos módulos sem conteúdo
   
   **Etapa 2 - Gerar cada módulo individualmente**:
   - Para cada módulo, fazer uma chamada separada à API
   - Cada chamada recebe contexto do módulo anterior
   - Atualizar progresso no job (10%, 20%, etc.)

c) **Adicionar função de geração de módulo único**:

```
+------------------------------------------+
|  Fluxo Atual (Problemático)              |
+------------------------------------------+
| 1 requisição → 8 módulos (truncados)     |
| Resultado: 7 placeholders                |
+------------------------------------------+

+------------------------------------------+
|  Fluxo Proposto                          |
+------------------------------------------+
| Requisição 1 → Estrutura + Módulo 1      |
| Requisição 2 → Módulo 2                  |
| Requisição 3 → Módulo 3                  |
| ...                                      |
| Requisição 8 → Módulo 8                  |
| Resultado: 8 módulos completos           |
+------------------------------------------+
```

d) **Atualizar tabela de jobs para progresso detalhado**:
   - Adicionar coluna `progress_detail` (ex: "Gerando módulo 3 de 8")
   - Frontend exibe progresso mais detalhado

**2. Frontend (`src/pages/admin/CreateCourseAI.tsx`)**

a) **Mostrar progresso detalhado**:
   - Exibir qual módulo está sendo gerado
   - Barra de progresso por módulo

b) **Atualizar estimativas de tempo**:
   - Para geração sequencial: ~2-3 minutos por módulo
   - Aviso: "Cursos enciclopédicos podem levar 15-20 minutos"

**3. Validação pós-geração**

Adicionar verificação após geração:
- Checar se algum módulo contém placeholders conhecidos
- Se detectar placeholder, tentar regenerar módulo específico
- Log de erro para depuração

### Detalhes Técnicos

**Nova função para gerar módulo individual:**

```typescript
async function generateSingleModule(
  supabase: any,
  apiKey: string,
  model: string,
  courseTopic: string,
  moduleTitle: string,
  moduleIndex: number,
  totalModules: number,
  minWords: number,
  previousModulesContext: string
): Promise<{ title: string; content: string }>
```

**Atualização da tabela de jobs:**

```sql
ALTER TABLE course_generation_jobs 
ADD COLUMN progress_detail TEXT;
```

**Padrões de placeholder a detectar:**

```typescript
const placeholderPatterns = [
  /CONTEÚDO DO MÓDULO \d+ COM MÍNIMO/i,
  /MODULE \d+ CONTENT WITH MINIMUM/i,
  /\[INSERIR CONTEÚDO\]/i,
  /\[CONTEÚDO SERÁ ADICIONADO\]/i
];
```

### Estimativas de Tempo por Configuração

| Modelo + Profundidade | Módulos | Tempo Estimado |
|----------------------|---------|----------------|
| GPT-4o + Qualquer | 3-8 | 1-2 minutos |
| O1/O3 + Básico/Detalhado | 3-8 | 2-3 minutos |
| O1/O3 + Extenso | 5-8 | 8-10 minutos |
| O1/O3 + Muito Extenso | 6-8 | 12-15 minutos |
| O1/O3 + Profissional | 6-8 | 15-18 minutos |
| O1/O3 + Enciclopédico | 8 | 20-25 minutos |

### Benefícios da Solução

1. **Garantia de conteúdo completo**: Cada módulo recebe tokens suficientes
2. **Progresso visível**: Usuário vê qual módulo está sendo gerado
3. **Recuperação de erros**: Se um módulo falhar, pode ser regenerado
4. **Qualidade consistente**: Cada módulo com mesma profundidade

### Resumo das Alterações de Arquivos

1. **supabase/functions/generate-course/index.ts**
   - Adicionar lógica de geração sequencial
   - Criar função `generateSingleModule`
   - Adicionar detecção de placeholders
   - Atualizar progresso detalhado

2. **src/pages/admin/CreateCourseAI.tsx**
   - Exibir progresso por módulo
   - Atualizar estimativas de tempo
   - Mostrar aviso para gerações longas

3. **Migração SQL**
   - Adicionar coluna `progress_detail` na tabela `course_generation_jobs`

