import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely sanitize HTML content to prevent DOM conflicts and XSS attacks
 * @param html - Raw HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
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
    .replace(/<meta\b[^<]*(?:(?!>\/?>)<[^<]*)*>/gi, '');
}

/**
 * Safely render HTML content with proper error handling
 * @param content - HTML content to render
 * @param className - CSS classes to apply
 * @returns JSX element with sanitized content
 */
export function renderSafeHtml(content: string, className: string = ''): React.ReactElement | null {
  if (!content || typeof content !== 'string') {
    return null;
  }

  const sanitizedContent = sanitizeHtml(content);

  return React.createElement('div', {
    className,
    dangerouslySetInnerHTML: { __html: sanitizedContent }
  });
}
