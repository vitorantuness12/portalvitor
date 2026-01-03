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

    const processInlineFormatting = (line: string): React.ReactNode => {
      // Remove ** and process bold
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-semibold text-foreground">{part}</strong>;
        }
        return part;
      });
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

      // Headers (### or ##)
      if (trimmedLine.startsWith('###')) {
        flushList();
        const headerText = trimmedLine.replace(/^###\s*/, '');
        elements.push(
          <h4 key={index} className="text-base sm:text-lg font-semibold text-foreground mt-6 mb-3">
            {headerText}
          </h4>
        );
        return;
      }

      if (trimmedLine.startsWith('##')) {
        flushList();
        const headerText = trimmedLine.replace(/^##\s*/, '');
        elements.push(
          <h3 key={index} className="text-lg sm:text-xl font-bold text-foreground mt-6 mb-3">
            {headerText}
          </h3>
        );
        return;
      }

      if (trimmedLine.startsWith('#')) {
        flushList();
        const headerText = trimmedLine.replace(/^#\s*/, '');
        elements.push(
          <h2 key={index} className="text-xl sm:text-2xl font-bold text-foreground mt-6 mb-4">
            {headerText}
          </h2>
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
    return elements;
  };

  return (
    <div className={`formatted-content ${className}`}>
      {formatContent(content)}
    </div>
  );
}
