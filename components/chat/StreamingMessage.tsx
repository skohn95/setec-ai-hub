'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface StreamingMessageProps {
  content: string
}

/**
 * Cursor component that appears inline with text
 */
const Cursor = () => (
  <span
    data-testid="typing-cursor"
    className="inline-block w-2 h-4 ml-0.5 bg-setec-orange/70 animate-pulse rounded-sm align-text-bottom"
    aria-label="Typing..."
  />
)

/**
 * StreamingMessage component displays a message that is being streamed
 * Renders markdown in real-time to match ChatMessage appearance
 * Injects a typing cursor at the end of the content
 */
export default function StreamingMessage({ content }: StreamingMessageProps) {
  // Custom components to inject cursor at the end of text
  const components: Components = {
    // For paragraphs, append cursor to the last one
    p: ({ children, ...props }) => (
      <p {...props}>
        {children}
        <Cursor />
      </p>
    ),
  }

  // If content is empty, just show cursor
  if (!content || !content.trim()) {
    return (
      <div
        data-testid="streaming-message"
        role="listitem"
        className="group px-4 md:px-8 py-2"
      >
        <div className="flex flex-col items-start">
          <div
            data-testid="message-bubble"
            className="inline-block text-sm leading-relaxed max-w-[85%] md:max-w-[70%] bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tl-md shadow-sm"
          >
            <Cursor />
          </div>
          <span className="flex items-center gap-1 text-[10px] text-setec-orange mt-1 px-1">
            <span className="inline-block w-1.5 h-1.5 bg-setec-orange rounded-full animate-pulse" />
            Analizando...
          </span>
        </div>
      </div>
    )
  }

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
          {/* Markdown content with cursor injected into paragraphs */}
          <div className="markdown-content break-words prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-li:my-0 [&_p:not(:last-of-type)>[data-testid=typing-cursor]]:hidden">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Streaming indicator */}
        <span className="flex items-center gap-1 text-[10px] text-setec-orange mt-1 px-1">
          <span className="inline-block w-1.5 h-1.5 bg-setec-orange rounded-full animate-pulse" />
          Analizando...
        </span>
      </div>
    </div>
  )
}
