'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import type { Components } from 'react-markdown'

/**
 * Convert LaTeX delimiters to remark-math compatible format
 * \[...\] -> $$...$$ (display math)
 * \(...\) -> $...$ (inline math)
 */
function convertLatexDelimiters(content: string): string {
  return content
    // Display math: \[...\] -> $$...$$
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    // Inline math: \(...\) -> $...$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')
}

interface StreamingMessageProps {
  content: string
  isThinking?: boolean
}

/**
 * Cursor component that appears at the end of streaming text
 */
const Cursor = () => (
  <span
    data-testid="typing-cursor"
    className="inline-block w-2 h-4 ml-0.5 bg-setec-orange/70 animate-pulse rounded-sm align-text-bottom"
    aria-label="Escribiendo..."
  />
)

/**
 * ThinkingIndicator shows animated dots while waiting for response
 */
const ThinkingIndicator = () => (
  <div className="flex items-center gap-1">
    <span className="w-2 h-2 bg-setec-orange/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-2 h-2 bg-setec-orange/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 bg-setec-orange/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
)

// Sentinel character to mark cursor position
const CURSOR_SENTINEL = '\u200B\u200B\u200B'

/**
 * StreamingMessage component displays a message that is being streamed
 * Shows thinking indicator while waiting, then renders markdown with cursor at end
 */
export default function StreamingMessage({ content, isThinking = false }: StreamingMessageProps) {
  // Show thinking indicator when waiting for first content
  const showThinking = isThinking && (!content || !content.trim())

  // Append sentinel to content for cursor injection, converting LaTeX delimiters
  const contentWithSentinel = useMemo(() => {
    if (!content) return ''
    return convertLatexDelimiters(content) + CURSOR_SENTINEL
  }, [content])

  // Custom components to inject cursor at the sentinel position
  const components: Components = useMemo(() => ({
    // Handle text nodes to inject cursor at sentinel
    p: ({ children, ...props }) => {
      const processChildren = (child: React.ReactNode): React.ReactNode => {
        if (typeof child === 'string' && child.includes(CURSOR_SENTINEL)) {
          const parts = child.split(CURSOR_SENTINEL)
          return (
            <>
              {parts[0]}
              <Cursor />
              {parts.slice(1).join('')}
            </>
          )
        }
        return child
      }

      const processedChildren = Array.isArray(children)
        ? children.map((child, i) => <span key={i}>{processChildren(child)}</span>)
        : processChildren(children)

      return <p {...props}>{processedChildren}</p>
    },
    // Handle list items similarly
    li: ({ children, ...props }) => {
      const processChildren = (child: React.ReactNode): React.ReactNode => {
        if (typeof child === 'string' && child.includes(CURSOR_SENTINEL)) {
          const parts = child.split(CURSOR_SENTINEL)
          return (
            <>
              {parts[0]}
              <Cursor />
              {parts.slice(1).join('')}
            </>
          )
        }
        return child
      }

      const processedChildren = Array.isArray(children)
        ? children.map((child, i) => <span key={i}>{processChildren(child)}</span>)
        : processChildren(children)

      return <li {...props}>{processedChildren}</li>
    },
  }), [])

  return (
    <div
      data-testid="streaming-message"
      role="listitem"
      className="group px-4 md:px-8 py-2"
    >
      <div className="flex flex-col items-start">
        {/* Message bubble */}
        <div
          data-testid="message-bubble"
          className="inline-block text-sm leading-relaxed max-w-[85%] md:max-w-[70%] bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tl-md shadow-sm"
        >
          {showThinking ? (
            <ThinkingIndicator />
          ) : (
            <div className="markdown-content break-words prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-li:my-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={components}
              >
                {contentWithSentinel}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <span className="flex items-center gap-1 text-[10px] text-setec-orange mt-1 px-1">
          <span className="inline-block w-1.5 h-1.5 bg-setec-orange rounded-full animate-pulse" />
          {showThinking ? 'Pensando...' : 'Escribiendo...'}
        </span>
      </div>
    </div>
  )
}
