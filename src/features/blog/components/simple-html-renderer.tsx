'use client';

import React from 'react';

interface SimpleHtmlRendererProps {
  content: string;
  className?: string;
}

/**
 * Simple HTML renderer that converts HTML to plain text
 * This completely avoids DOM conflicts and removeChild errors
 */
export function SimpleHtmlRenderer({ content, className = '' }: SimpleHtmlRendererProps) {
  // Convert HTML to plain text safely
  const convertHtmlToText = (html: string): string => {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Get text content (this removes all HTML tags)
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    // Clean up
    tempDiv.remove();

    return textContent;
  };

  // Process content line by line to preserve some formatting
  const processContent = (html: string): string[] => {
    const text = convertHtmlToText(html);
    return text.split('\n').filter(line => line.trim().length > 0);
  };

  const contentLines = processContent(content);

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {contentLines.map((line, index) => (
        <p key={index} className="mb-4 leading-relaxed">
          {line}
        </p>
      ))}
    </div>
  );
}
