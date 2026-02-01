

## Expandir Opções de Profundidade de Conteúdo

### Objetivo
Adicionar novas opções de profundidade do conteúdo para permitir a criação de cursos com módulos mais extensos: 3.000, 4.000, 5.000+ palavras por módulo.

### Arquivos a Modificar

**1. Frontend - Criação Individual de Curso**
`src/pages/admin/CreateCourseAI.tsx`

- Adicionar novas opções no Select de "Profundidade do Conteúdo":
  - **Muito Extenso**: ~3000 palavras/módulo
  - **Profissional**: ~4000 palavras/módulo  
  - **Enciclopédico**: ~5000 palavras/módulo

**2. Frontend - Criação em Massa**
`src/pages/admin/BulkCreateCourseAI.tsx`

- Adicionar as mesmas opções ao Select de profundidade

**3. Backend - Função de Geração Individual**
`supabase/functions/generate-course/index.ts`

- Expandir o objeto `depthConfig` com os novos níveis:
```typescript
const depthConfig = {
  basico: { minWords: 500, maxTokens: 8000, description: "resumido e direto ao ponto" },
  detalhado: { minWords: 1000, maxTokens: 12000, description: "com bom nível de detalhes e exemplos" },
  extenso: { minWords: 2000, maxTokens: 16000, description: "extremamente completo como um livro didático" },
  muito_extenso: { minWords: 3000, maxTokens: 24000, description: "altamente detalhado com teoria e prática aprofundadas" },
  profissional: { minWords: 4000, maxTokens: 32000, description: "conteúdo de nível profissional com cobertura completa" },
  enciclopedico: { minWords: 5000, maxTokens: 40000, description: "conteúdo enciclopédico com máximo nível de detalhamento" }
};
```

**4. Backend - Função de Geração em Massa**
`supabase/functions/generate-course-bulk/index.ts`

- Aplicar as mesmas alterações no `depthConfig`
- Atualizar a lógica de decisão automática da IA para considerar os novos níveis

### Novas Opções de Interface

```text
+----------------------------------+
| Profundidade do Conteúdo         |
+----------------------------------+
| 🤖 IA decide automaticamente     |
| 📝 Básico (~500 palavras)        |
| 📄 Detalhado (~1000 palavras)    |
| 📚 Extenso (~2000 palavras)      |
| 📖 Muito Extenso (~3000 palavras)| ← NOVO
| 🎓 Profissional (~4000 palavras) | ← NOVO
| 📕 Enciclopédico (~5000 palavras)| ← NOVO
+----------------------------------+
```

### Considerações Técnicas

**Tokens da API OpenAI:**
- Cursos com 5000 palavras/módulo requerem `max_tokens` de 40.000
- O modelo gpt-4o-mini suporta até 128k tokens de contexto
- Pode haver aumento no tempo de geração para conteúdos muito extensos

**Timeout:**
- O frontend já possui timeout de 10 minutos (600.000ms)
- Suficiente para gerar conteúdo extenso

**Aviso ao Usuário:**
- Adicionar nota informando que níveis mais profundos levam mais tempo para gerar

