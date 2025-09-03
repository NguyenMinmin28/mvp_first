'use client';

import React from 'react';

interface PlainTextRendererProps {
  content: string;
  className?: string;
}

/**
 * Completely safe plain text renderer
 * This avoids any DOM manipulation and prevents all removeChild errors
 */
export function PlainTextRenderer({ content, className = '' }: PlainTextRendererProps) {
  // Simple regex-based HTML tag removal
  const removeHtmlTags = (html: string): string => {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return html
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode common HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const plainText = removeHtmlTags(content);

  // Split into paragraphs based on double line breaks or common separators
  const paragraphs = plainText
    .split(/\n\s*\n|\.\s+[A-Z]/)
    .filter(p => p.trim().length > 0)
    .map(p => p.trim());

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4 leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
