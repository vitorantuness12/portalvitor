import { motion } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'O certificado é reconhecido?',
    answer: 'Sim! Nossos certificados são válidos em todo o território nacional como curso livre, conforme a Lei nº 9.394/96. Cada certificado possui um código único que pode ser validado em nossa página de verificação.',
  },
  {
    question: 'Qual a nota mínima para aprovação?',
    answer: 'A nota mínima para aprovação na prova final é 7,0 (sete). Ao atingir essa nota, seu certificado é gerado automaticamente e fica disponível para download imediato.',
  },
  {
    question: 'Posso estudar pelo celular?',
    answer: 'Sim! Nossa plataforma é 100% responsiva e funciona perfeitamente em smartphones, tablets e computadores. Estude onde e quando quiser.',
  },
  {
    question: 'Por quanto tempo tenho acesso ao curso?',
    answer: 'Você tem acesso vitalício! Uma vez matriculado, o curso é seu para sempre. Pode revisitar o conteúdo quantas vezes quiser, sem prazo de expiração.',
  },
  {
    question: 'Posso refazer a prova se não passar?',
    answer: 'Atualmente, cada aluno tem uma tentativa na prova final. Por isso, recomendamos estudar todo o conteúdo e fazer os exercícios práticos antes de realizar a prova.',
  },
  {
    question: 'Como funciona o suporte?',
    answer: 'Oferecemos suporte via chat com inteligência artificial para dúvidas rápidas e um sistema de tickets para questões mais complexas. Nossa equipe responde em até 24 horas úteis.',
  },
  {
    question: 'Os cursos gratuitos também dão certificado?',
    answer: 'Sim! Todos os cursos da plataforma, incluindo os gratuitos, oferecem certificado de conclusão após aprovação na prova final.',
  },
  {
    question: 'Como faço para validar um certificado?',
    answer: 'Basta acessar a página de validação de certificados e inserir o código único presente no documento. O sistema confirmará a autenticidade automaticamente.',
  },
];

export function FAQSection() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">
            FAQ
          </span>
          <h2 className="font-display font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-6xl mb-4">
            Perguntas{' '}
            <span className="hero-gradient-text">Frequentes</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre nossa plataforma.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card/40 backdrop-blur border border-border/60 rounded-2xl px-5 sm:px-6 data-[state=open]:border-primary/50 data-[state=open]:shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.3)] transition-all"
              >
                <AccordionTrigger className="text-left text-sm sm:text-base font-bold py-5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12 p-8 bg-card/40 backdrop-blur rounded-2xl border border-primary/30 max-w-2xl mx-auto shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.4)]"
        >
          <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-xl mb-2">Ainda tem dúvidas?</h3>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">
            Nossa equipe está pronta para ajudar você.
          </p>
          <a
            href="/suporte"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm shadow-[0_0_24px_hsl(var(--primary)/0.4)]"
          >
            Falar com Suporte
          </a>
        </motion.div>
      </div>
    </section>
  );
}
