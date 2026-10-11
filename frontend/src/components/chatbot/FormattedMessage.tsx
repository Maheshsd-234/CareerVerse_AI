import React, { useState } from "react";
import { ExternalLink, ShieldCheck, Info, Copy, Check, Sparkles } from "lucide-react";
import type { ChatSource } from "../../types";

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
  sources?: ChatSource[] | null;
  mode?: string | null;
  isStreaming?: boolean;
}

// Clean raw HTML tags from LLM responses if any
const sanitizeText = (raw: string): string => {
  return raw.replace(/<\/?(ul|ol|li|p|div|span|strong|em|b|i|br)\b[^>]*>/gi, (match) => {
    if (/^<br\s*\/?>$/i.test(match)) return "\n";
    if (/^<\/(li|p|div)>$/i.test(match)) return "\n";
    if (/^<li\b[^>]*>/i.test(match)) return "• ";
    return "";
  });
};

// Render inline styles: bold, italic, inline code, and matching [n] citation badges
const renderInline = (text: string, sources?: ChatSource[] | null): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  // Tokenize bold **...**, italic *...*, inline code `...`, and citations [1], [2]
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[\d+\])/g;
  const tokens = text.split(regex);

  const sourceMap = new Map<number, ChatSource>();
  if (sources && Array.isArray(sources)) {
    for (const s of sources) {
      if (typeof s.index === "number") {
        sourceMap.set(s.index, s);
      }
    }
  }

  tokens.forEach((token, index) => {
    if (!token) return;

    // 1. Inline code
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      parts.push(
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[#4F46E5] font-data text-xs font-semibold border border-gray-200"
        >
          {token.slice(1, -1)}
        </code>
      );
      return;
    }

    // 2. Bold text
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      parts.push(
        <strong key={index} className="font-display font-bold text-[#12122B]">
          {renderInline(token.slice(2, -2), sources)}
        </strong>
      );
      return;
    }

    // 3. Italic text
    if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      parts.push(
        <em key={index} className="italic text-[#12122B]/90">
          {renderInline(token.slice(1, -1), sources)}
        </em>
      );
      return;
    }

    // 4. Citation badge [n]
    const citationMatch = token.match(/^\[(\d+)\]$/);
    if (citationMatch) {
      const citationNum = parseInt(citationMatch[1], 10);
      const matchedSource = sourceMap.get(citationNum);

      if (matchedSource) {
        parts.push(
          <span
            key={index}
            className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-data font-bold rounded-md bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/25 mx-0.5 align-baseline"
            title={`${matchedSource.title} (Verified: ${matchedSource.last_verified || "N/A"})`}
          >
            [{citationNum}]
          </span>
        );
        return;
      }
    }

    // 5. Plain text
    parts.push(token);
  });

  return parts;
};

// Render a Markdown table cleanly
const renderTable = (tableLines: string[], tableKey: number, sources?: ChatSource[] | null): React.ReactNode => {
  const parsedRows: string[][] = [];

  for (const line of tableLines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    // Skip separator lines like |---|---|
    if (/^\|[\s\-:|]+\|?$/.test(trimmed)) continue;

    let cells = trimmed.split("|");
    if (cells[0] === "") cells.shift();
    if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
    cells = cells.map((c) => c.trim()).filter((c, idx) => idx === 0 || c !== "");

    if (cells.length > 0) {
      parsedRows.push(cells);
    }
  }

  if (parsedRows.length === 0) return null;

  const [headerRow, ...bodyRows] = parsedRows;

  if (bodyRows.length === 0 && headerRow.length === 1) {
    return (
      <div key={tableKey} className="my-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-body text-[#12122B]">
        {renderInline(headerRow[0], sources)}
      </div>
    );
  }

  return (
    <div key={tableKey} className="my-4 overflow-x-auto rounded-xl border border-gray-200 shadow-xs bg-white">
      <table className="w-full text-left text-xs border-collapse">
        {headerRow && (
          <thead className="bg-[#12122B] text-white font-display font-bold">
            <tr>
              {headerRow.map((col, idx) => (
                <th key={idx} className="px-3.5 py-2.5 font-data text-[11px] uppercase tracking-wider border-r border-white/10 last:border-r-0">
                  {renderInline(col, sources)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-gray-100 font-body text-[#12122B]">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white hover:bg-gray-50/80" : "bg-[#FAFAF7] hover:bg-gray-50/80"}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2.5 border-r border-gray-100 last:border-r-0 leading-relaxed">
                  {renderInline(cell, sources)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormattedMessage: React.FC<FormattedMessageProps> = ({
  content,
  isUser,
  sources,
  mode,
  isStreaming,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  // Pre-stream state: show inline search & synthesis animation
  if (!content.trim() && isStreaming) {
    return (
      <div className="flex items-center gap-2.5 py-1 text-xs text-[#4F46E5]">
        <div className="w-6 h-6 rounded-lg bg-[#4F46E5]/10 flex items-center justify-center animate-pulse">
          <Sparkles size={13} className="text-[#4F46E5]" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-semibold text-[#12122B]">Counselor is synthesizing...</span>
          <span className="text-[11px] font-body text-[#6B7280]">Searching verified guides and drafting guidance</span>
        </div>
      </div>
    );
  }

  const sanitized = sanitizeText(content);
  const lines = sanitized.split("\n");
  const elements: React.ReactNode[] = [];

  let currentTable: string[] = [];
  let inTable = false;
  let elementKey = 0;

  const flushTable = () => {
    if (currentTable.length > 0) {
      elements.push(renderTable(currentTable, elementKey++, sources));
      currentTable = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Markdown table detection
    if (line.startsWith("|")) {
      inTable = true;
      currentTable.push(rawLine);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Skip horizontal rules
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(line)) {
      elements.push(<hr key={elementKey++} className="my-4 border-t border-gray-200" />);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={elementKey++} className="text-base font-display font-bold text-[#12122B] mt-4 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
          {renderInline(line.slice(4), sources)}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={elementKey++} className="text-lg font-display font-bold text-[#12122B] mt-5 mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
          {renderInline(line.slice(3), sources)}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={elementKey++} className="text-xl font-display font-extrabold text-[#12122B] mt-4 mb-3">
          {renderInline(line.slice(2), sources)}
        </h1>
      );
      continue;
    }

    // Blockquotes
    if (line.startsWith(">")) {
      const quoteText = line.replace(/^>\s*/, "");
      elements.push(
        <div key={elementKey++} className="my-3 p-3 rounded-xl bg-[#4F46E5]/5 border-l-4 border-[#4F46E5] text-xs font-body text-[#12122B]">
          {renderInline(quoteText, sources)}
        </div>
      );
      continue;
    }

    // Bullet points
    if (/^[-*•]\s+/.test(line)) {
      const bulletText = line.replace(/^[-*•]\s+/, "");
      elements.push(
        <div key={elementKey++} className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm font-body text-[#12122B] leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-2 shrink-0" />
          <div className="flex-1">{renderInline(bulletText, sources)}</div>
        </div>
      );
      continue;
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const numText = numberedMatch[2];
      elements.push(
        <div key={elementKey++} className="flex items-start gap-2.5 my-2 text-xs sm:text-sm font-body text-[#12122B] leading-relaxed">
          <span className="w-5 h-5 rounded-full bg-[#12122B] text-white flex items-center justify-center text-[10px] font-data font-bold shrink-0 mt-0.5 shadow-xs">
            {num}
          </span>
          <div className="flex-1 pt-0.5">{renderInline(numText, sources)}</div>
        </div>
      );
      continue;
    }

    // Blank line
    if (!line) {
      elements.push(<div key={elementKey++} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={elementKey++} className="my-1.5 text-xs sm:text-sm font-body text-[#12122B]/90 leading-relaxed">
        {renderInline(line, sources)}
      </p>
    );
  }

  flushTable();

  // Render sources drawer at the bottom if sources are available
  const hasSources = Boolean(sources && Array.isArray(sources) && sources.length > 0);

  return (
    <div className="space-y-1 relative group">
      {/* Streaming blinking cursor */}
      <div>
        {elements}
        {isStreaming && (
          <span
            className="inline-block w-2 h-4 ml-1 bg-[#4F46E5] rounded-xs animate-pulse align-middle"
            title="Streaming..."
          />
        )}
      </div>

      {!isUser && mode === "general_guidance" && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 text-[11px] font-body text-[#6B7280]">
          <Info size={13} className="shrink-0 text-[#6B7280]/70" />
          <span>General guidance &amp; tips • Not from verified knowledge base sources</span>
        </div>
      )}

      {hasSources && (
        <div className="mt-4 pt-3 border-t border-gray-200/75">
          <div className="flex items-center gap-1.5 text-[10px] font-data font-bold text-[#6B7280] uppercase tracking-wider mb-2">
            <ShieldCheck size={13} className="text-[#14B8A6]" />
            Verified Sources ({sources?.length})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sources?.map((source) => {
              const isWebUrl = Boolean(
                source.url &&
                  (source.url.startsWith("http://") || source.url.startsWith("https://"))
              );

              return (
                <div
                  key={source.index}
                  className="p-2.5 rounded-xl bg-gray-50/80 border border-gray-200/80 flex flex-col justify-between text-xs"
                >
                  <div className="flex items-start gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-[#4F46E5]/10 text-[#4F46E5] font-data font-bold text-[10px] shrink-0 mt-0.5">
                      [{source.index}]
                    </span>

                    {isWebUrl ? (
                      <a
                        href={source.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-[#4F46E5] hover:underline flex items-center gap-1 line-clamp-2"
                      >
                        <span>{source.title}</span>
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    ) : (
                      <span className="font-display font-semibold text-[#12122B] line-clamp-2">
                        {source.title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-data text-[#6B7280] mt-2 pt-1 border-t border-gray-100">
                    <span className="uppercase">{source.category}</span>
                    {source.last_verified && <span>Verified: {source.last_verified}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Footer: Copy button */}
      {!isUser && !isStreaming && content.trim() && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-display text-gray-400 hover:text-[#4F46E5] hover:bg-[#4F46E5]/5 transition cursor-pointer"
            title="Copy answer"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-600" />
                <span className="text-green-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
