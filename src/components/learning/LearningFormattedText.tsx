import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { processLearningContent, type ProcessedContent } from '@/lib/learning/contentProcessor'
import { TermLink } from './TermLink'
import { InlineGraph } from './InlineGraph'
import { CalloutBlock } from './CalloutBlock'
import { useMemo } from 'react'
import type { LessonTerm } from '@/types'

interface LearningFormattedTextProps {
  children: string
  lessonTerms?: LessonTerm[]
}

function MarkdownSegment({ content, processed }: { content: string; processed: ProcessedContent }) {
  // Pre-process subscript/superscript
  const markdown = content
    .replace(/\^([^^\s]+)\^/g, '<sup>$1</sup>')
    .replace(/~([^~\s]+)~/g, '<sub>$1</sub>')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl font-serif font-bold text-parchment mt-12 mb-4 leading-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-serif font-semibold text-parchment mt-10 mb-3 leading-snug">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-serif font-semibold text-parchment mt-8 mb-2 leading-snug">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-semibold text-parchment mt-6 mb-2">{children}</h4>
        ),
        p: ({ children }) => <p className="mb-6 leading-[1.85]">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-parchment">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        del: ({ children }) => <del className="line-through opacity-60">{children}</del>,
        code: ({ className, children }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <code className={`block bg-deep-obsidian p-4 rounded-lg font-mono text-sm overflow-x-auto leading-relaxed ${className || ''}`}>
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
        pre: ({ children }) => (
          <pre className="bg-deep-obsidian rounded-lg overflow-hidden my-6">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-[3px] border-icon-gold pl-6 my-6 italic text-warm-gray">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => <ul className="list-disc list-outside ml-6 my-4 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-outside ml-6 my-4 space-y-2">{children}</ol>,
        li: ({ children }) => <li className="text-warm-gray leading-[1.75]">{children}</li>,
        a: ({ href, children }) => {
          // Handle term links: term://termId
          if (href?.startsWith('term://')) {
            const termId = href.slice(7)
            const termRef = processed.terms.get(termId)
            if (termRef) {
              return <TermLink termRef={termRef}>{children}</TermLink>
            }
          }
          // Regular link
          return (
            <a
              href={href}
              className="text-deep-azure hover:text-icon-gold transition-colors underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          )
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="min-w-full border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="border-b border-ash-stone">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-ash-stone/30">{children}</tr>,
        th: ({ children }) => <th className="px-4 py-3 text-left text-parchment font-medium text-sm">{children}</th>,
        td: ({ children }) => <td className="px-4 py-3 text-warm-gray text-sm">{children}</td>,
        hr: () => <hr className="my-8 border-ash-stone/30" />,
        sup: ({ children }) => <sup className="text-[0.75em]">{children}</sup>,
        sub: ({ children }) => <sub className="text-[0.75em]">{children}</sub>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

export function LearningFormattedText({ children, lessonTerms = [] }: LearningFormattedTextProps) {
  const processed = useMemo(() => {
    const result = processLearningContent(children)

    // Merge lesson-level terms into the term map (case-insensitive, include definition)
    for (const lt of lessonTerms) {
      for (const [key, ref] of result.terms) {
        if (ref.displayText.toLowerCase() === lt.term.toLowerCase()) {
          result.terms.set(key, {
            ...ref,
            conceptId: ref.conceptId || lt.concept_id,
            definition: ref.definition || lt.definition,
          })
        }
      }
    }

    return result
  }, [children, lessonTerms])

  return (
    <div className="lesson-reader">
      {processed.segments.map((segment, i) => {
        switch (segment.type) {
          case 'markdown':
            return <MarkdownSegment key={i} content={segment.content} processed={processed} />
          case 'graph':
            return (
              <InlineGraph
                key={i}
                expression={segment.ref.expression}
                xMin={segment.ref.xMin}
                xMax={segment.ref.xMax}
              />
            )
          case 'callout':
            return (
              <CalloutBlock key={i} type={segment.calloutType}>
                <MarkdownSegment content={segment.content} processed={processed} />
              </CalloutBlock>
            )
        }
      })}
    </div>
  )
}
