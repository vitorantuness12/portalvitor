

## Adicionar Selo Dourado no Certificado PDF

### Problema Identificado
O PDF do certificado baixado pelo aluno (em `CourseCertificate.tsx`) **não possui** os selos/badges dourados que aparecem no preview do admin (`CertificatePreviewPdf.tsx`). O preview mostra os badges nas posições superior esquerda e direita, mas esses elementos não foram implementados no documento final.

### Solução
Adicionar o selo dourado no canto do certificado PDF de download, utilizando a mesma estrutura já existente no preview do admin, mas aplicando ao documento real do aluno.

### Alterações Técnicas

**Arquivo: `src/pages/CourseCertificate.tsx`**

1. Adicionar estilos para o badge/selo no `StyleSheet`:
```typescript
badge: {
  position: 'absolute',
  top: 35,
  alignItems: 'center',
},
badgeCircle: {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',
},
badgeText: {
  fontSize: 6,
  fontFamily: 'Montserrat',
  fontWeight: 700,
  textTransform: 'uppercase',
  marginTop: 4,
},
```

2. Renderizar os selos dourados na página frontal do certificado (após a borda e ondas decorativas):
   - **Selo esquerdo**: Ícone de estrela com fundo azul e borda dourada + texto "PREMIUM"
   - **Selo direito**: Ícone de estrela com fundo dourado + texto "QUALIDADE"

3. Buscar as configurações de badges da tabela `certificate_config` para permitir customização pelo admin

### Estrutura Visual do Selo

```text
+------------------------------------------+
| [★ PREMIUM]                 [★ QUALIDADE]|
|                                          |
|            CERTIFICADO                   |
|          DE CONCLUSÃO                    |
|                                          |
|        João da Silva                     |
|        ──────●──────                     |
|                                          |
+------------------------------------------+
```

### Detalhes do Design do Selo

- **Selo Circular**: 48x48 pixels com borda dourada
- **Ícone**: Estrela (★) centralizada
- **Cores**: 
  - Selo esquerdo: Fundo azul primário, borda e estrela douradas
  - Selo direito: Fundo dourado sólido, estrela branca
- **Texto**: Abaixo do selo, em maiúsculas, cor primária
- **Posição**: Top 35px, esquerda 35px / direita 35px

### Customização pelo Admin
O sistema já possui campos na configuração do certificado para personalizar:
- `left_badge_url` - Imagem customizada para selo esquerdo
- `right_badge_url` - Imagem customizada para selo direito  
- `left_badge_text` - Texto do selo esquerdo (padrão: "PREMIUM")
- `right_badge_text` - Texto do selo direito (padrão: "QUALIDADE")

Esses valores serão lidos da configuração e aplicados dinamicamente no PDF.

