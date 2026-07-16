import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  text: string
  onCite?: (n: number) => void
}

/**
 * Renders the bot's answer as GitHub-flavored Markdown.
 * Bare citation markers like [1] are converted to clickable badges that
 * highlight the matching source in the source bar (via onCite).
 */
export default function Markdown({ text, onCite }: Props) {
  // Turn `[3]` (not already a link) into a link with a private #cite-N scheme,
  // which we intercept below and render as an interactive citation badge.
  const withCitations = text.replace(/\[(\d+)\](?!\()/g, '[$1](#cite-$1)')

  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children, ...rest }) {
            if (href && href.startsWith('#cite-')) {
              const n = Number(href.slice('#cite-'.length))
              return (
                <button
                  type="button"
                  className="cite"
                  title={`Jump to source ${n}`}
                  onClick={() => onCite?.(n)}
                >
                  {n}
                </button>
              )
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
              </a>
            )
          },
        }}
      >
        {withCitations}
      </ReactMarkdown>
    </div>
  )
}
