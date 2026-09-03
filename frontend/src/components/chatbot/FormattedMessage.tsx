import React from "react";

interface FormattedMessageProps {
  content: string;
  isUser?: boolean;
}

// Clean raw HTML tags from LLM responses if any
const sanitizeText = (raw: string): string => {
  return raw
    .replace(/<\/?(ul|ol|li|p|div|span|strong|em|b|i|br)\b[^>]*>/gi, (match) => {
      if (/^<br\s*\/?>$/i.test(match)) return "\n";
      if (/^<\/(li|p|div)>$/i.test(match)) return "\n";
      if (/^<li\b[^>]*>/i.test(match)) return "• ";
      return "";
    });
};

// Render inline styles: bold, italic, inline code
const renderInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  // Tokenize bold **...**, italic *...*, and inline code `...`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const tokens = text.split(regex);

  tokens.forEach((token, index) => {
    if (!token) return;

    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      parts.push(
        <strong key={index} className="font-display font-bold text-[#12122B]">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      parts.push(
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-gray-100 text-[#4F46E5] font-data text-xs font-semibold border border-gray-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      parts.push(
        <em key={index} className="italic text-[#12122B]/90">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      parts.push(token);
    }
  });

  return parts;
};

// Render a Markdown table cleanly
const renderTable = (tableLines: string[], tableKey: number): React.ReactNode => {
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

  // If it's a single line item, render as clean card
  if (bodyRows.length === 0 && headerRow.length === 1) {
    return (
      <div key={tableKey} className="my-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-body text-[#12122B]">
        {renderInline(headerRow[0])}
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
                  {renderInline(col)}
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
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const FormattedMessage: React.FC<FormattedMessageProps> = ({ content, isUser }) => {
  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  const sanitized = sanitizeText(content);
  const lines = sanitized.split("\n");
  const elements: React.ReactNode[] = [];

  let currentTable: string[] = [];
  let inTable = false;
  let elementKey = 0;

  const flushTable = () => {
    if (currentTable.length > 0) {
      elements.push(renderTable(currentTable, elementKey++));
      currentTable = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check if line is part of a markdown table (starts with |)
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
          {renderInline(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={elementKey++} className="text-lg font-display font-bold text-[#12122B] mt-5 mb-2.5 pb-1 border-b border-gray-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4F46E5]" />
          {renderInline(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={elementKey++} className="text-xl font-display font-extrabold text-[#12122B] mt-4 mb-3">
          {renderInline(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquotes / Tips
    if (line.startsWith(">")) {
      const quoteText = line.replace(/^>\s*/, "");
      elements.push(
        <div key={elementKey++} className="my-3 p-3 rounded-xl bg-[#4F46E5]/5 border-l-4 border-[#4F46E5] text-xs font-body text-[#12122B]">
          {renderInline(quoteText)}
        </div>
      );
      continue;
    }

    // Bullet points (- or * or •)
    if (/^[-*•]\s+/.test(line)) {
      const bulletText = line.replace(/^[-*•]\s+/, "");
      elements.push(
        <div key={elementKey++} className="flex items-start gap-2.5 my-1.5 text-xs sm:text-sm font-body text-[#12122B] leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-2 shrink-0" />
          <div className="flex-1">{renderInline(bulletText)}</div>
        </div>
      );
      continue;
    }

    // Numbered lists (1. 2. etc.)
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const numText = numberedMatch[2];
      elements.push(
        <div key={elementKey++} className="flex items-start gap-2.5 my-2 text-xs sm:text-sm font-body text-[#12122B] leading-relaxed">
          <span className="w-5 h-5 rounded-full bg-[#12122B] text-white flex items-center justify-center text-[10px] font-data font-bold shrink-0 mt-0.5 shadow-xs">
            {num}
          </span>
          <div className="flex-1 pt-0.5">{renderInline(numText)}</div>
        </div>
      );
      continue;
    }

    // Blank lines
    if (!line) {
      elements.push(<div key={elementKey++} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={elementKey++} className="my-1.5 text-xs sm:text-sm font-body text-[#12122B]/90 leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  flushTable();

  return <div className="space-y-1">{elements}</div>;
};
