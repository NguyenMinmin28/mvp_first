'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface SafeHtmlRendererProps {
  content: string;
  className?: string;
}

/**
 * Safely renders HTML content without using dangerouslySetInnerHTML
 * This prevents DOM conflicts and removeChild errors
 */
export function SafeHtmlRenderer({ content, className = '' }: SafeHtmlRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML content
  const sanitizeHtml = useCallback((html: string): string => {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Remove potentially dangerous elements and attributes
    return html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      // Remove embed tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: protocol
      .replace(/javascript:/gi, '')
      // Remove data: protocol
      .replace(/data:/gi, '')
      // Remove vbscript: protocol
      .replace(/vbscript:/gi, '')
      // Remove expression() in CSS
      .replace(/expression\s*\(/gi, '')
      // Remove eval() calls
      .replace(/eval\s*\(/gi, '')
      // Remove base64 encoded content
      .replace(/base64/gi, '')
      // Remove potentially dangerous CSS
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove link tags that could load external resources
      .replace(/<link\b[^<]*(?:(?!>\/?>)<[^<]*)*>/gi, '')
      // Remove meta tags that could be malicious
      .replace(/<meta\b[^<]*(?:(?!>\/?>)<[^<]*)*>/gi, '')
      // Remove form tags to prevent CSRF
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      // Remove input tags
      .replace(/<input\b[^<]*(?:(?!>\/?>)<[^<]*)*>/gi, '')
      // Remove button tags
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
      // Remove select tags
      .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '')
      // Remove textarea tags
      .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '');
  }, []);

  // Render content safely
  const renderContent = useCallback((htmlContent: string) => {
    if (!containerRef.current || !htmlContent) return;

    try {
      // Clear existing content first
      containerRef.current.innerHTML = '';

      // Create a temporary container to parse and sanitize HTML
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = sanitizeHtml(htmlContent);

      // Additional DOM sanitization
      const dangerousElements = tempContainer.querySelectorAll('script, iframe, object, embed, style, link, meta, form, input, button, select, textarea');
      dangerousElements.forEach(el => {
        try {
          // Safely remove elements - remove() is safe even if element is detached
          el.remove();
        } catch (error) {
          // Element may have already been removed, ignore error
          console.debug('Error removing dangerous element:', error);
        }
      });

      // Remove event handlers from all remaining elements
      const allElements = tempContainer.querySelectorAll('*');
      allElements.forEach(el => {
        const element = el as HTMLElement;
        // Remove all on* attributes
        Array.from(element.attributes).forEach(attr => {
          if (attr.name.startsWith('on') || 
              (attr.value && (attr.value.startsWith('javascript:') || 
                             attr.value.startsWith('data:') || 
                             attr.value.startsWith('vbscript:')))) {
            element.removeAttribute(attr.name);
          }
        });
      });

      // Append sanitized content
      containerRef.current.innerHTML = tempContainer.innerHTML;

    } catch (error) {
      console.error('Error rendering HTML content:', error);
      // Fallback: display content as plain text
      if (containerRef.current) {
        containerRef.current.textContent = htmlContent.replace(/<[^>]*>/g, '');
      }
    }
  }, [sanitizeHtml]);

  useEffect(() => {
    renderContent(content);
  }, [content, renderContent]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`prose prose-lg max-w-none ${className}`}
    />
  );
}
