import React from 'react';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  const formatContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let listType: 'ordered' | 'unordered' | null = null;
    let blockquoteLines: string[] = [];

    const processInlineFormatting = (line: string): React.ReactNode[] => {
      // Process in order: links, code, bold, italic
      const tokens: React.ReactNode[] = [];
      let remaining = line;
      let keyCounter = 0;

      while (remaining.length > 0) {
        // Find the earliest match
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
        
        // Add text before the match
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

      // Headers (### or ##)
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

      // Ordered list (1. 2. 3.)
      const orderedMatch = trimmedLine.match(/^\d+\.\s+(.*)$/);
      if (orderedMatch) {
        if (listType !== 'ordered') {
          flushList();
          listType = 'ordered';
        }
        listItems.push(orderedMatch[1]);
        return;
      }

      // Unordered list (- or *)
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
    return elements;
  };

  return (
    <div className={`formatted-content ${className}`}>
      {formatContent(content)}
    </div>
  );
}
