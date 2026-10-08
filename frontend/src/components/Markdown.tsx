import ReactMarkdown, { type Components } from "react-markdown";

// Answers come from an LLM that reads uploaded documents, so they are untrusted.
// No rehype-raw here: HTML in an answer must never be rendered as HTML.
const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  h1: ({ children }) => <p className="mb-2 font-semibold text-slate-100">{children}</p>,
  h2: ({ children }) => <p className="mb-2 font-semibold text-slate-100">{children}</p>,
  h3: ({ children }) => <p className="mb-2 font-semibold text-slate-100">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded bg-slate-800 px-1 py-0.5 text-[0.85em]">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-950 p-3 last:mb-0">{children}</pre>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-brand-400 underline">
      {children}
    </a>
  ),
};

// gpt-oss models sometimes cite in their own format, like 【1†L3-L4】, even when asked for [1].
const toBracketCitations = (text: string) => text.replace(/【(\d+)(?:†[^】]*)?】/g, "[$1]");

export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{toBracketCitations(children)}</ReactMarkdown>;
}
