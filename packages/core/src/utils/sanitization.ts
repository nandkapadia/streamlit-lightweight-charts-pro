/**
 * @fileoverview HTML Sanitization Utilities
 *
 * Provides XSS-safe HTML rendering utilities for tooltips, legends, and other
 * DOM-injected content. Uses a whitelist approach to allow safe HTML while
 * blocking potentially malicious content.
 *
 * Security model:
 * - Escape all HTML entities by default
 * - Whitelist safe HTML tags for formatted content
 * - Strip event handlers and dangerous attributes
 * - No external resource loading (scripts, iframes)
 */

/**
 * HTML entities that need escaping for XSS prevention
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Whitelist of safe HTML tags for formatted content
 */
const SAFE_TAGS = new Set([
  'div',
  'span',
  'p',
  'br',
  'b',
  'i',
  'strong',
  'em',
  'u',
  'small',
  'sub',
  'sup',
  'table',
  'tr',
  'td',
  'th',
  'thead',
  'tbody',
]);

/**
 * Whitelist of safe HTML attributes
 */
const SAFE_ATTRS = new Set(['class', 'style', 'id', 'title', 'role', 'aria-label']);

/**
 * Dangerous patterns to strip from style attributes
 */
const DANGEROUS_STYLE_PATTERNS = [
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /behavior\s*:/gi,
  /-moz-binding/gi,
  /url\s*\(\s*["']?\s*data:/gi,
];

/**
 * Escape HTML entities in a string
 *
 * Converts special characters to their HTML entity equivalents to prevent
 * XSS attacks when inserting user-provided content into the DOM.
 *
 * @param str - String to escape
 * @returns Escaped string safe for innerHTML
 *
 * @example
 * ```typescript
 * escapeHtml('<script>alert("xss")</script>');
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.replace(/[&<>"'`=/]/g, match => HTML_ESCAPE_MAP[match] || match);
}

/**
 * Sanitize HTML content allowing only safe tags and attributes
 *
 * Uses a whitelist approach to allow formatting while blocking potentially
 * dangerous content like scripts, event handlers, and external resources.
 *
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 *
 * @example
 * ```typescript
 * sanitizeHtml('<div onclick="alert(1)">Safe <b>text</b></div>');
 * // Returns: '<div>Safe <b>text</b></div>'
 * ```
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a temporary container for parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Process all elements
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null);

  const nodesToRemove: Node[] = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    const element = currentNode as Element;
    const tagName = element.tagName.toLowerCase();

    // Remove unsafe tags entirely
    if (!SAFE_TAGS.has(tagName)) {
      nodesToRemove.push(element);
    } else {
      // Remove unsafe attributes
      const attrs = Array.from(element.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();

        // Remove event handlers (onclick, onload, etc.)
        if (attrName.startsWith('on')) {
          element.removeAttribute(attr.name);
          continue;
        }

        // Remove non-whitelisted attributes
        if (!SAFE_ATTRS.has(attrName)) {
          element.removeAttribute(attr.name);
          continue;
        }

        // Sanitize style attribute
        if (attrName === 'style') {
          element.setAttribute('style', sanitizeStyle(attr.value));
        }
      }
    }

    currentNode = walker.nextNode();
  }

  // Remove unsafe nodes (in reverse to avoid index issues)
  for (const node of nodesToRemove.reverse()) {
    // Replace unsafe element with its text content
    const textNode = document.createTextNode(node.textContent || '');
    node.parentNode?.replaceChild(textNode, node);
  }

  return doc.body.innerHTML;
}

/**
 * Sanitize CSS style string
 *
 * Removes potentially dangerous CSS patterns like expressions, javascript: URLs,
 * and binding behaviors that could execute code.
 *
 * @param style - CSS style string
 * @returns Sanitized style string
 */
export function sanitizeStyle(style: string): string {
  if (!style) return '';

  let sanitized = style;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_STYLE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}

/**
 * Create safe text node from potentially unsafe string
 *
 * Creates a DOM Text node which is inherently safe from XSS as browsers
 * treat it as text, not HTML.
 *
 * @param text - Text content (may contain HTML that should be displayed as text)
 * @returns Text node
 */
export function createSafeTextNode(text: string): Text {
  return document.createTextNode(text || '');
}

/**
 * Set innerHTML safely with sanitization
 *
 * Convenience function that sanitizes HTML before setting innerHTML.
 *
 * @param element - Target element
 * @param html - HTML content to sanitize and set
 */
export function setInnerHtmlSafe(element: HTMLElement, html: string): void {
  element.innerHTML = sanitizeHtml(html);
}

/**
 * Set text content safely (no HTML interpretation)
 *
 * Uses textContent which is inherently safe as it doesn't parse HTML.
 *
 * @param element - Target element
 * @param text - Text content to set
 */
export function setTextContentSafe(element: HTMLElement, text: string): void {
  element.textContent = text;
}
