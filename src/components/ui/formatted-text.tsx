import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'

interface FormattedTextProps {
  children: string
  className?: string
  inline?: boolean
}

/**
 * FormattedText component that renders markdown with support for:
 * - Math equations: $inline$ and $$block$$
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Strikethrough: ~~text~~
 * - Code: `inline code` and ```code blocks```
 * - Links: [text](url)
 * - Lists: - item or 1. item
 * - Blockquotes: > quote
 * - Headings: # H1, ## H2, etc.
 * - Tables: | col | col |
 * - Subscript: H~2~O (via custom)
 * - Superscript: x^2^ (via custom)
 */
export function FormattedText({ children, className, inline = false }: FormattedTextProps) {
  if (!children) return null

  // Pre-process for subscript and superscript
  // H~2~O -> H₂O, x^2^ -> x²
  const processed = children
    // Superscript: x^2^ -> <sup>2</sup>
    .replace(/\^([^^\s]+)\^/g, '<sup>$1</sup>')
    // Subscript: H~2~O -> <sub>2</sub>
    .replace(/~([^~\s]+)~/g, '<sub>$1</sub>')

  if (inline) {
    return (
      <span className={cn("formatted-text-inline", className)}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ children }) => <span>{children}</span>,
            sup: ({ children }) => <sup className="text-[0.75em]">{children}</sup>,
            sub: ({ children }) => <sub className="text-[0.75em]">{children}</sub>,
            code: ({ children }) => (
              <code className="bg-ash-stone/30 px-1 py-0.5 rounded text-[0.9em] font-mono text-icon-gold">
                {children}
              </code>
            ),
            a: ({ href, children }) => (
              <a href={href} className="text-deep-azure hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            strong: ({ children }) => <strong className="font-semibold text-parchment">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
          }}
          allowedElements={['p', 'span', 'strong', 'em', 'code', 'a', 'del', 'sup', 'sub']}
        >
          {processed}
        </ReactMarkdown>
      </span>
    )
  }

  return (
    <div className={cn("formatted-text prose prose-invert prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-serif text-parchment mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-serif text-parchment mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-parchment mt-3 mb-1">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold text-parchment mt-2 mb-1">{children}</h4>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-parchment">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
          code: ({ className, children }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <code className={cn(
                  "block bg-deep-obsidian p-3 rounded-md font-mono text-xs overflow-x-auto",
                  className
                )}>
                  {children}
                </code>
              )
            }
            return (
              <code className="bg-ash-stone/30 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-icon-gold">
                {children}
              </code>
            )
          },
          pre: ({ children }) => <pre className="bg-deep-obsidian rounded-md overflow-hidden my-2">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-icon-gold pl-3 my-2 italic text-warm-gray">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-warm-gray">{children}</li>,
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-deep-azure hover:text-icon-gold transition-colors underline" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="border-b border-ash-stone">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-ash-stone/30">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-parchment font-medium text-sm">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-warm-gray text-sm">{children}</td>,
          hr: () => <hr className="my-4 border-ash-stone/50" />,
          sup: ({ children }) => <sup className="text-[0.75em]">{children}</sup>,
          sub: ({ children }) => <sub className="text-[0.75em]">{children}</sub>,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Compact version for single-line displays like titles
 */
export function FormattedTitle({ children, className }: { children: string; className?: string }) {
  return <FormattedText inline className={className}>{children}</FormattedText>
}
