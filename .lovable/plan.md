
# Plano de Implementação: Carteirinha de Estudante

## Resumo da Funcionalidade

Criar uma carteirinha de estudante digital com as seguintes características:
- Geração automática com dados do aluno
- Upload de foto do estudante para a carteirinha
- QR Code e código para validação online
- Plano Digital: R$ 29,90
- Plano Impresso: R$ 49,90 + frete
- Validade de 1 ano

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUXO DO USUÁRIO                             │
├─────────────────────────────────────────────────────────────────────┤
│  Perfil do Aluno  ──>  Solicitar Carteirinha  ──>  Upload de Foto   │
│                              │                          │           │
│                              v                          v           │
│                    Escolher Plano (Digital/Impresso)                │
│                              │                                      │
│                              v                                      │
│                    Pagamento (integração futura)                    │
│                              │                                      │
│                              v                                      │
│         Carteirinha Gerada (PDF + Validação Online)                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Etapas de Implementação

### 1. Banco de Dados

Criar tabela `student_cards` para armazenar as carteirinhas:

**Campos:**
- `id` (uuid, PK)
- `user_id` (uuid, FK para auth.users)
- `card_code` (text, único) - Código de validação (ex: CARD-ABC123)
- `photo_url` (text) - URL da foto do estudante
- `plan_type` (enum: 'digital', 'printed') - Tipo do plano
- `status` (enum: 'pending_payment', 'active', 'expired', 'cancelled')
- `shipping_address` (jsonb, nullable) - Endereço para carteirinhas impressas
- `shipping_status` (enum, nullable) - Status do envio
- `issued_at` (timestamp) - Data de emissão
- `expires_at` (timestamp) - Data de expiração (1 ano após emissão)
- `paid_at` (timestamp, nullable) - Data do pagamento
- `amount_paid` (numeric) - Valor pago
- `created_at`, `updated_at`

**Políticas RLS:**
- Alunos podem visualizar e criar suas próprias carteirinhas
- Administradores podem visualizar e gerenciar todas

### 2. Storage Bucket

Criar bucket `student-card-photos` para armazenar as fotos das carteirinhas:
- Bucket público para exibição nas carteirinhas
- RLS para upload apenas pelo próprio usuário

### 3. Páginas do Aluno

**3.1 Página de Solicitação (`/minha-carteirinha`)**
- Formulário de upload de foto (3x4, formato adequado)
- Preview da carteirinha em tempo real
- Seleção do plano (Digital R$29,90 / Impresso R$49,90)
- Formulário de endereço (apenas para plano impresso)
- Botão de confirmar solicitação

**3.2 Página de Visualização da Carteirinha**
- Exibir carteirinha digital (frente e verso)
- Download em PDF
- Informações de status e validade
- QR Code para validação

**3.3 Integração no Dashboard**
- Card de "Carteirinha de Estudante" no dashboard
- Badge de status (Ativa/Expirada/Pendente)

### 4. Página de Validação Pública

**Rota: `/validar-carteirinha`**
- Similar à validação de certificados
- Busca pelo código ou scan do QR Code
- Exibe: foto, nome, data de validade, status

### 5. Painel Administrativo

**Nova página `/admin/carteirinhas`:**
- Listagem de todas as carteirinhas emitidas
- Filtros por status (pendente, ativa, expirada)
- Gerenciamento de status de envio (para impressas)
- Estatísticas de vendas

### 6. Geração do PDF da Carteirinha

Componente similar ao certificado usando `@react-pdf/renderer`:

**Frente da Carteirinha:**
- Logo da instituição
- Foto do estudante
- Nome completo
- Matrícula/Código
- Data de validade
- QR Code de validação

**Verso da Carteirinha:**
- Informações da instituição
- Código de validação
- URL de validação
- Termos de uso resumidos

---

## Detalhes Técnicos

### Estrutura de Arquivos Novos

```text
src/
├── pages/
│   ├── StudentCard.tsx              # Página da carteirinha do aluno
│   ├── ValidateStudentCard.tsx      # Validação pública
│   └── admin/
│       └── StudentCards.tsx         # Gerenciamento admin
├── components/
│   └── studentCard/
│       ├── StudentCardForm.tsx      # Formulário de solicitação
│       ├── StudentCardPreview.tsx   # Preview visual
│       ├── StudentCardPdf.tsx       # Geração do PDF
│       └── PhotoUpload.tsx          # Componente de upload de foto
```

### Validação de Foto

- Formato: JPG, PNG
- Tamanho máximo: 2MB
- Proporção recomendada: 3x4
- Preview com crop/ajuste

### Geração do Código

Formato: `CARD-XXXXXX` (6 caracteres alfanuméricos)

### QR Code

Conteúdo: URL de validação com o código
Exemplo: `https://formarensino.com.br/validar-carteirinha?codigo=CARD-ABC123`

---

## Considerações sobre Pagamento

**Nota:** Este plano não inclui integração de pagamento. Para implementar o pagamento, será necessário:
1. Ativar integração com Stripe
2. Criar produtos/preços no Stripe
3. Implementar checkout
4. Webhook para confirmar pagamento e ativar carteirinha

Por enquanto, a carteirinha será criada com status "pending_payment" e o admin poderá ativar manualmente após confirmação do pagamento por outros meios.

---

## Rotas do Aplicativo

| Rota | Descrição |
|------|-----------|
| `/minha-carteirinha` | Página do aluno para ver/solicitar carteirinha |
| `/validar-carteirinha` | Validação pública da carteirinha |
| `/admin/carteirinhas` | Gerenciamento administrativo |

---

## Próximos Passos (Fase 2)

- Integração com Stripe para pagamento automático
- Integração com serviço de impressão/envio
- Notificações de expiração (30 dias antes)
- Renovação automática
