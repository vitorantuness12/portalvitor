import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import php from 'highlight.js/lib/languages/php';
import ruby from 'highlight.js/lib/languages/ruby';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import 'highlight.js/styles/github-dark.css';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('php', php);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <div className="relative my-4 rounded-lg overflow-hidden">
      {language && (
        <div className="bg-muted/80 px-4 py-1.5 text-xs font-mono text-muted-foreground border-b border-border">
          {language}
        </div>
      )}
      <pre className="!m-0 !rounded-t-none overflow-x-auto">
        <code
          ref={codeRef}
          className={`hljs ${language ? `language-${language}` : ''} !bg-[#0d1117] !p-4 block text-sm`}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  const formatContent = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ordered' | 'unordered' | null = null;
    let blockquoteLines: string[] = [];
    let codeBlockLines: string[] = [];
    let codeBlockLanguage: string | undefined;
    let inCodeBlock = false;

    const lines = text.split('\n');

    const processInlineFormatting = (line: string): React.ReactNode[] => {
      const tokens: React.ReactNode[] = [];
      let remaining = line;
      let keyCounter = 0;

      while (remaining.length > 0) {
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
        const codeMatch = remaining.match(/`([^`]+)`/);
        const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
        const italicMatch = remaining.match(/\*([^*]+)\*/);

        const matches = [
          { type: 'link', match: linkMatch, index: linkMatch?.index ?? Infinity },
          { type: 'code', match: codeMatch, index: codeMatch?.index ?? Infinity },
          { type: 'bold', match: boldMatch, index: boldMatch?.index ?? Infinity },
          { type: 'italic', match: italicMatch, index: italicMatch?.index ?? Infinity },
        ].filter(m => m.match !== null);

        if (matches.length === 0) {
          tokens.push(remaining);
          break;
        }

        const earliest = matches.reduce((a, b) => (a.index < b.index ? a : b));
        
        if (earliest.index > 0) {
          tokens.push(remaining.slice(0, earliest.index));
        }

        const match = earliest.match!;
        
        switch (earliest.type) {
          case 'link':
            tokens.push(
              <a
                key={`link-${keyCounter++}`}
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              >
                {match[1]}
              </a>
            );
            remaining = remaining.slice(earliest.index + match[0].length);
            break;
          case 'code':
            tokens.push(
              <code
                key={`code-${keyCounter++}`}
                className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[0.9em]"
              >
                {match[1]}
              </code>
            );
            remaining = remaining.slice(earliest.index + match[0].length);
            break;
          case 'bold':
            tokens.push(
              <strong key={`bold-${keyCounter++}`} className="font-semibold text-foreground">
                {match[1]}
              </strong>
            );
            remaining = remaining.slice(earliest.index + match[0].length);
            break;
          case 'italic':
            tokens.push(
              <em key={`italic-${keyCounter++}`} className="italic">
                {match[1]}
              </em>
            );
            remaining = remaining.slice(earliest.index + match[0].length);
            break;
        }
      }

      return tokens;
    };

    const flushCodeBlock = () => {
      if (codeBlockLines.length > 0) {
        elements.push(
          <CodeBlock
            key={`codeblock-${elements.length}`}
            code={codeBlockLines.join('\n')}
            language={codeBlockLanguage}
          />
        );
        codeBlockLines = [];
        codeBlockLanguage = undefined;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        elements.push(
          <blockquote
            key={`quote-${elements.length}`}
            className="border-l-4 border-primary/50 bg-primary/5 pl-4 py-3 pr-3 my-4 rounded-r-lg"
          >
            {blockquoteLines.map((line, i) => (
              <p key={i} className="text-muted-foreground italic">
                {processInlineFormatting(line)}
              </p>
            ))}
          </blockquote>
        );
        blockquoteLines = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === 'ordered') {
          elements.push(
            <ol key={`list-${elements.length}`} className="space-y-2 mb-4">
              {listItems.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 pt-0.5">{processInlineFormatting(item)}</span>
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`list-${elements.length}`} className="space-y-2 mb-4">
              {listItems.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  <span className="flex-1">{processInlineFormatting(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        listItems = [];
        listType = null;
      }
    };

    lines.forEach((line, index) => {
      // Check for code block start/end
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          inCodeBlock = false;
          flushCodeBlock();
        } else {
          // Start code block
          flushList();
          flushBlockquote();
          inCodeBlock = true;
          const langMatch = line.trim().match(/^```(\w+)?/);
          codeBlockLanguage = langMatch?.[1]?.toLowerCase();
        }
        return;
      }

      // If inside code block, collect lines
      if (inCodeBlock) {
        codeBlockLines.push(line);
        return;
      }

      const trimmedLine = line.trim();

      // Blockquote (> text)
      if (trimmedLine.startsWith('>')) {
        flushList();
        const quoteText = trimmedLine.replace(/^>\s*/, '');
        blockquoteLines.push(quoteText);
        return;
      } else {
        flushBlockquote();
      }

      // Headers
      if (trimmedLine.startsWith('###')) {
        flushList();
        const headerText = trimmedLine.replace(/^###\s*/, '');
        elements.push(
          <h4 key={index} className="text-base sm:text-lg font-semibold text-foreground mt-6 mb-3">
            {processInlineFormatting(headerText)}
          </h4>
        );
        return;
      }

      if (trimmedLine.startsWith('##')) {
        flushList();
        const headerText = trimmedLine.replace(/^##\s*/, '');
        elements.push(
          <h3 key={index} className="text-lg sm:text-xl font-bold text-foreground mt-6 mb-3">
            {processInlineFormatting(headerText)}
          </h3>
        );
        return;
      }

      if (trimmedLine.startsWith('#')) {
        flushList();
        const headerText = trimmedLine.replace(/^#\s*/, '');
        elements.push(
          <h2 key={index} className="text-xl sm:text-2xl font-bold text-foreground mt-6 mb-4">
            {processInlineFormatting(headerText)}
          </h2>
        );
        return;
      }

      // Horizontal rule
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        flushList();
        elements.push(
          <hr key={index} className="my-6 border-border" />
        );
        return;
      }

      // Ordered list
      const orderedMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
      if (orderedMatch) {
        if (listType !== 'ordered') {
          flushList();
          listType = 'ordered';
        }
        listItems.push(orderedMatch[1]);
        return;
      }

      // Unordered list
      const unorderedMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
      if (unorderedMatch) {
        if (listType !== 'unordered') {
          flushList();
          listType = 'unordered';
        }
        listItems.push(unorderedMatch[1]);
        return;
      }

      // Empty line
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={index} className="text-muted-foreground mb-3 leading-relaxed">
          {processInlineFormatting(trimmedLine)}
        </p>
      );
    });

    flushList();
    flushBlockquote();
    flushCodeBlock();
    return elements;
  };

  return (
    <div className={`formatted-content ${className}`}>
      {formatContent(content)}
    </div>
  );
}
