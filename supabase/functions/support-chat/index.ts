import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Você precisa estar logado para usar o chat." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão expirada. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch courses for context
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, description, short_description, duration_hours, level, price, category_id")
      .eq("status", "active")
      .limit(30);

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name");

    const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

    const coursesContext = courses?.map(c => {
      const catName = c.category_id ? categoryMap.get(c.category_id) || "Sem categoria" : "Sem categoria";
      return `- ${c.title} (${catName}): ${c.short_description || c.description?.substring(0, 150)}. Duração: ${c.duration_hours}h. Nível: ${c.level}. Preço: ${c.price === 0 ? "Gratuito" : `R$ ${c.price}`}`;
    }).join("\n") || "Nenhum curso disponível no momento.";

    const systemPrompt = `Você é o assistente virtual da Formak, uma plataforma de cursos online com certificação. Seja educado, prestativo e objetivo. Responda sempre em português brasileiro.

## Sobre a Formak

A Formak é uma plataforma de cursos online que oferece cursos em diversas áreas do conhecimento, com certificação digital validável. O aluno pode estudar no seu ritmo, fazer exercícios e provas, e receber certificados ao ser aprovado.

## Páginas e funcionalidades do sistema

### Cursos (/cursos)
- Catálogo de todos os cursos disponíveis
- Filtros por categoria, nível (Iniciante, Intermediário, Avançado) e preço (Gratuitos/Pagos)
- Barra de busca para encontrar cursos por nome

### Detalhes do Curso (/cursos/:id)
- Descrição completa, carga horária, nível e preço
- Botão "Matricular-se" para cursos gratuitos (matrícula instantânea)
- Botão "Comprar" para cursos pagos (redireciona para pagamento)

### Meus Cursos (/meus-cursos)
- Lista de cursos em que o aluno está matriculado
- Mostra progresso de cada curso
- Acesso rápido para continuar estudando

### Área de Estudo (/cursos/:id/estudar)
- Conteúdo do curso dividido em módulos
- Navegação sequencial entre módulos (anterior/próximo)
- Exercícios de fixação em cada módulo (múltipla escolha)
- Barra de progresso geral do curso
- Botão para baixar o conteúdo em PDF
- Área de notas pessoais para anotações durante o estudo

### Prova Final
- Disponível após completar todos os módulos (100% de progresso)
- Nota mínima para aprovação: 7.0 (70% de acertos)
- Máximo de 3 tentativas
- Questões de múltipla escolha
- Resultado imediato após envio

### Certificados (/meus-certificados)
- Gerado automaticamente após aprovação na prova final
- Certificado digital com QR code para validação
- Pode ser baixado em PDF
- Validação online pelo código do certificado ou QR code em /validar-certificado

### Carteirinha de Estudante (/carteirinha)
- Carteirinha digital disponível para todos os alunos
- Opção de carteirinha física (enviada pelos Correios)
- Planos: Digital (gratuito ou pago) / Física (pago)
- Pagamento via Pix ou cartão de crédito
- Validação online em /validar-carteirinha pelo código ou QR code

### Perfil (/perfil)
- Edição de nome completo, WhatsApp e foto de avatar
- Visualização do email cadastrado

### Dashboard do Aluno (/dashboard)
- Visão geral do progresso nos cursos
- Atalhos rápidos para as principais funcionalidades

### Suporte
- Chat com IA (este chat que você está usando agora)
- Opção de abrir ticket para atendimento humano clicando em "Falar com Humano"
- Tickets de suporte com histórico de mensagens

## Fluxo de matrícula e pagamento

### Cursos gratuitos
1. Acessar o curso desejado
2. Clicar em "Matricular-se Gratuitamente"
3. Acesso imediato ao conteúdo

### Cursos pagos
1. Acessar o curso desejado
2. Clicar em "Comprar Curso"
3. Escolher forma de pagamento: Pix ou Cartão de Crédito
4. Pagamento processado pelo Mercado Pago
5. Pix: gera QR code para pagamento (validade limitada)
6. Cartão: processamento imediato
7. Após confirmação do pagamento, acesso liberado automaticamente

## Fluxo de estudo

1. Acessar "Meus Cursos" → selecionar o curso
2. Estudar os módulos sequencialmente
3. Responder exercícios de fixação de cada módulo
4. Completar 100% dos módulos
5. Realizar a prova final (nota mínima 7.0, até 3 tentativas)
6. Se aprovado: certificado gerado automaticamente
7. Se reprovado após 3 tentativas: status "failed", pode solicitar suporte

## App PWA

- A Formak pode ser instalada como app no celular
- Funciona offline para conteúdo já carregado
- Notificações push para atualizações

## Onboarding

- Ao criar conta, o aluno seleciona seus interesses (categorias)
- O sistema personaliza recomendações com base nos interesses

## Cursos disponíveis atualmente

${coursesContext}

## Instruções de comportamento

1. Responda dúvidas sobre cursos, funcionamento da plataforma, pagamentos, certificados e suporte
2. Se o aluno perguntar sobre um curso específico, use as informações dos cursos listados acima
3. Se não souber a resposta ou for um problema técnico complexo, sugira que o aluno clique em "Falar com Humano" para abrir um ticket de suporte
4. Seja sempre cordial, profissional e direto
5. Não invente informações que não estão neste contexto
6. Se o aluno quiser falar com um atendente humano, diga: "Clique no botão 'Falar com Humano' abaixo para abrir um ticket de suporte e um atendente irá ajudá-lo."`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history || []).map((msg: { content: string; isBot: boolean }) => ({
            role: msg.isBot ? "assistant" : "user",
            content: msg.content,
          })),
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Limite de uso atingido." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Erro ao processar sua mensagem");
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Support chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
