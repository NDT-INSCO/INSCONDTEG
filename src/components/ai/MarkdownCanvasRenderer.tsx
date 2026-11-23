import React, { useState } from 'react';
import { Check, Copy, PanelRightOpen } from 'lucide-react';
import { normaliseSafeExternalUrl, type ChatGptCanvasArtifact } from '../../ai/agentsContract';

interface MarkdownCanvasRendererProps {
  content: string;
  isAr?: boolean;
  onOpenInCanvas?: (artifact: ChatGptCanvasArtifact) => void;
}

function renderInlineSegments(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`c-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-300 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`i-${keyIdx++}`} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        const safeUrl = normaliseSafeExternalUrl(linkMatch[2]);
        if (safeUrl) {
          parts.push(
            <a
              key={`a-${keyIdx++}`}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
            >
              {linkMatch[1]}
            </a>
          );
        } else {
          parts.push(linkMatch[1]);
        }
      } else {
        parts.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

const CodeBlock: React.FC<{
  language: string;
  code: string;
  isAr: boolean;
  onOpenInCanvas?: (artifact: ChatGptCanvasArtifact) => void;
}> = ({ language, code, isAr, onOpenInCanvas }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="my-2 rounded-xl border border-slate-800 bg-[#050a18] overflow-hidden text-left" dir="ltr">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-[10px] font-mono text-slate-400">
        <span className="uppercase font-bold text-cyan-400">{language || 'text'}</span>
        <div className="flex items-center gap-1.5">
          {onOpenInCanvas && (
            <button
              type="button"
              onClick={() =>
                onOpenInCanvas({
                  id: `code-${Date.now()}`,
                  title: `${(language || 'Snippet').toUpperCase()} Artifact`,
                  kind: language === 'html' ? 'html' : language === 'svg' ? 'svg' : 'code',
                  language: language || 'text',
                  content: code,
                })
              }
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 cursor-pointer"
            >
              <PanelRightOpen className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'فتح في Canvas' : 'Open Canvas'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 cursor-pointer"
          >
            {copied ? (
              <Check className="w-3 h-3 shrink-0 text-emerald-400" aria-hidden="true" />
            ) : (
              <Copy className="w-3 h-3 shrink-0" aria-hidden="true" />
            )}
            <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed font-mono text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const MarkdownCanvasRenderer: React.FC<MarkdownCanvasRendererProps> = ({
  content,
  isAr = false,
  onOpenInCanvas,
}) => {
  if (!content) return null;

  // Split by fenced code blocks ```lang\n...\n```
  const segments = content.split(/(```[a-zA-Z0-9_-]*\n[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed text-slate-200">
      {segments.map((seg, segIdx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const firstNl = seg.indexOf('\n');
          const lang = firstNl > 3 ? seg.slice(3, firstNl).trim() : '';
          const body = firstNl !== -1 ? seg.slice(firstNl + 1, -3) : seg.slice(3, -3);
          return (
            <CodeBlock
              key={`cb-${segIdx}`}
              language={lang}
              code={body.trimEnd()}
              isAr={isAr}
              onOpenInCanvas={onOpenInCanvas}
            />
          );
        }

        const lines = seg.split('\n');
        const nodes: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];
          const trimmed = line.trim();

          if (!trimmed) {
            i += 1;
            continue;
          }

          // Table detection (| ... | followed by | --- |)
          if (
            trimmed.startsWith('|') &&
            i + 1 < lines.length &&
            /^\|[\s:|-]+\|/.test(lines[i + 1].trim())
          ) {
            const headers = trimmed
              .slice(1, trimmed.endsWith('|') ? -1 : undefined)
              .split('|')
              .map((h) => h.trim());
            i += 2; // skip header & separator
            const rows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
              const rowCells = lines[i]
                .trim()
                .slice(1, lines[i].trim().endsWith('|') ? -1 : undefined)
                .split('|')
                .map((c) => c.trim());
              rows.push(rowCells);
              i += 1;
            }
            nodes.push(
              <div key={`tbl-${segIdx}-${i}`} className="overflow-x-auto my-2 rounded-lg border border-slate-800">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="bg-slate-900 text-cyan-300 font-bold">
                    <tr>
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-2.5 py-1.5 text-start border-b border-slate-800">
                          {renderInlineSegments(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 bg-slate-950/60">
                    {rows.map((r, rIdx) => (
                      <tr key={rIdx}>
                        {r.map((cell, cIdx) => (
                          <td key={cIdx} className="px-2.5 py-1.5 text-slate-300">
                            {renderInlineSegments(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }

          // Headings
          if (trimmed.startsWith('### ')) {
            nodes.push(
              <h4 key={`h3-${segIdx}-${i}`} className="text-xs font-black text-cyan-300 pt-1">
                {renderInlineSegments(trimmed.slice(4))}
              </h4>
            );
            i += 1;
            continue;
          }
          if (trimmed.startsWith('## ')) {
            nodes.push(
              <h3 key={`h2-${segIdx}-${i}`} className="text-sm font-black text-white pt-1.5">
                {renderInlineSegments(trimmed.slice(3))}
              </h3>
            );
            i += 1;
            continue;
          }
          if (trimmed.startsWith('# ')) {
            nodes.push(
              <h2 key={`h1-${segIdx}-${i}`} className="text-base font-black text-white pt-2">
                {renderInlineSegments(trimmed.slice(2))}
              </h2>
            );
            i += 1;
            continue;
          }

          // Blockquote
          if (trimmed.startsWith('> ')) {
            nodes.push(
              <blockquote
                key={`bq-${segIdx}-${i}`}
                className="px-3 py-1.5 rounded-lg bg-slate-900/70 border border-cyan-500/30 text-slate-300 text-xs"
              >
                {renderInlineSegments(trimmed.slice(2))}
              </blockquote>
            );
            i += 1;
            continue;
          }

          // Bullet list
          if (/^[-*]\s+/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
              items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
              i += 1;
            }
            nodes.push(
              <ul key={`ul-${segIdx}-${i}`} className="list-disc ps-5 space-y-1">
                {items.map((it, idx) => (
                  <li key={idx}>{renderInlineSegments(it)}</li>
                ))}
              </ul>
            );
            continue;
          }

          // Numbered list
          if (/^\d+\.\s+/.test(trimmed)) {
            const items: string[] = [];
            while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
              items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
              i += 1;
            }
            nodes.push(
              <ol key={`ol-${segIdx}-${i}`} className="list-decimal ps-5 space-y-1">
                {items.map((it, idx) => (
                  <li key={idx}>{renderInlineSegments(it)}</li>
                ))}
              </ol>
            );
            continue;
          }

          nodes.push(
            <p key={`p-${segIdx}-${i}`} className="leading-relaxed">
              {renderInlineSegments(trimmed)}
            </p>
          );
          i += 1;
        }

        return <React.Fragment key={`seg-${segIdx}`}>{nodes}</React.Fragment>;
      })}
    </div>
  );
};
