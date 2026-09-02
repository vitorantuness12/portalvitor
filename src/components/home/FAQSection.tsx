import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, HelpCircle, MessageCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const faqs = [
  {
    question: 'O que é o certificado da Formak?',
    answer: 'O certificado da Formak é um documento de conclusão de curso livre, emitido conforme a Lei nº 9.394/96 (Diretrizes e Bases da Educação Nacional). Cursos livres não são equivalentes a graduação, curso técnico ou formação regulamentada, mas são amplamente aceitos para comprovação de qualificação profissional e participação em processos seletivos que aceitem cursos livres.',
  },
  {
    question: 'Para que serve o certificado?',
    answer: 'O certificado pode ser usado para comprovação de qualificação profissional, apresentação em entrevistas de emprego, inclusão no currículo, participação em concursos públicos que aceitem cursos livres, e complementação de horas em atividades acadêmicas. A aceitação depende da política de cada instituição ou empregador.',
  },
  {
    question: 'Como funciona a avaliação para obter o certificado?',
    answer: 'Cada curso possui uma prova ou atividade final, aplicada após a conclusão do conteúdo. A nota mínima para aprovação é 7,0 (sete). Ao atingir essa nota, o certificado é gerado automaticamente e fica disponível para download imediato na área do aluno.',
  },
  {
    question: 'Posso refazer a avaliação se não atingir 7,0?',
    answer: 'A quantidade de tentativas permitidas pode variar conforme o curso. Recomendamos estudar todo o conteúdo e fazer os exercícios práticos antes de realizar a avaliação. Caso o curso permita refazer, a informação estará disponível na página de detalhes da formação.',
  },
  {
    question: 'Por quanto tempo tenho acesso ao curso?',
    answer: 'Após a confirmação do pagamento, o acesso ao curso é vitalício — ou seja, uma vez adquirido, o curso fica disponível para você acessar e revisitar quantas vezes quiser, sem prazo de expiração.',
  },
  {
    question: 'Posso estudar pelo celular?',
    answer: 'Sim. A plataforma é totalmente responsiva e funciona em smartphones, tablets e computadores. Você pode estudar de onde quiser, no horário que preferir.',
  },
  {
    question: 'Como funcionam os cursos gratuitos?',
    answer: 'Algumas formações podem ser oferecidas gratuitamente como forma de você conhecer a plataforma. Nesses casos, o cadastro para acessar é gratuito. A disponibilidade e as condições de cada curso gratuito são definidas individualmente. O certificado dos cursos gratuitos segue as mesmas regras dos cursos pagos, conforme descrito na página de cada formação.',
  },
  {
    question: 'Como funciona o suporte?',
    answer: 'Oferecemos suporte via chat com inteligência artificial para dúvidas rápidas e um sistema de tickets para questões mais complexas. Nossa equipe responde em até 24 horas úteis nos dias úteis.',
  },
];

export function FAQSection() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-36">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-xs font-semibold">
            FAQ
          </Badge>
          <h2 className="font-display font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl mb-4">
            Perguntas{' '}
            <span className="hero-gradient-text">Frequentes</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Encontre respostas rápidas e transparentes para as dúvidas mais comuns.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto mb-14"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border/70 rounded-2xl px-6 data-[state=open]:border-primary/30 data-[state=open]:shadow-elevated transition-all duration-300"
              >
                <AccordionTrigger className="text-left py-5 hover:no-underline group">
                  <span className="font-semibold text-sm sm:text-base pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center p-10 bg-card rounded-3xl border border-border/70 shadow-elevated max-w-2xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display font-bold text-xl mb-2">Ainda tem dúvidas?</h3>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Nossa equipe está pronta para ajudar você.
          </p>
          <Link to="/suporte">
            <Button variant="hero" size="lg" className="gap-2 shadow-glow group">
              <MessageCircle className="h-5 w-5" />
              Falar com Suporte
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
