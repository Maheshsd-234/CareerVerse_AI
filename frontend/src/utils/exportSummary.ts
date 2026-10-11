import type { ChatMessage, ChatSource } from "../types";

/**
 * Format timestamp to a human-readable string.
 */
const formatDate = (date: Date | string | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/**
 * Slugify a title for filenames.
 */
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36) || "counseling-summary";
};

/**
 * Export conversation session as a clean Markdown (.md) document.
 */
export const exportToMarkdown = (sessionTitle: string, messages: ChatMessage[]): void => {
  if (!messages || messages.length === 0) return;

  const exportDate = new Date();
  const title = sessionTitle || "Career Counseling Summary";

  // Collect all verified sources cited throughout the conversation
  const allSources: ChatSource[] = [];
  const seenIndices = new Set<number>();
  for (const m of messages) {
    if (m.sources && Array.isArray(m.sources)) {
      for (const s of m.sources) {
        if (!seenIndices.has(s.index)) {
          seenIndices.add(s.index);
          allSources.push(s);
        }
      }
    }
  }

  let md = `# CareerVerse AI — Counseling Session Report\n\n`;
  md += `**Topic:** ${title}\n`;
  md += `**Exported On:** ${formatDate(exportDate)}\n`;
  md += `**Conversation Turns:** ${messages.filter((m) => m.role === "user").length}\n\n`;

  if (allSources.length > 0) {
    md += `## Verified Knowledge Base References\n\n`;
    allSources.forEach((s) => {
      const urlText = s.url ? ` ([Official Portal](${s.url}))` : "";
      const verified = s.last_verified ? ` — *Verified: ${s.last_verified}*` : "";
      md += `- **[${s.index}] ${s.title}** (${s.category.toUpperCase()})${verified}${urlText}\n`;
    });
    md += `\n---\n\n`;
  }

  md += `## Counseling Transcript\n\n`;

  let qCount = 1;
  for (const msg of messages) {
    if (msg.role === "user") {
      md += `### Q${qCount++}: ${msg.content.trim()}\n`;
      md += `*Sent on ${formatDate(msg.timestamp)}*\n\n`;
    } else {
      md += `**CareerVerse Counselor Guidance:**\n\n`;
      md += `${msg.content.trim()}\n\n`;

      if (msg.sources && msg.sources.length > 0) {
        md += `*Sources cited in this answer:* ${msg.sources.map((s) => `[${s.index}] ${s.title}`).join(", ")}\n\n`;
      }
      md += `---\n\n`;
    }
  }

  md += `\n*CareerVerse AI — 24/7 Grounded Career & Educational Guidance System for Indian Students*\n`;

  // Trigger file download
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `careerverse-${slugify(title)}-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export conversation session as a beautifully styled, high-res PDF via browser print.
 */
export const exportToPDF = (sessionTitle: string, messages: ChatMessage[]): void => {
  if (!messages || messages.length === 0) return;

  const exportDate = new Date();
  const title = sessionTitle || "Career Counseling Summary";

  // Collect all verified sources cited
  const allSources: ChatSource[] = [];
  const seenIndices = new Set<number>();
  for (const m of messages) {
    if (m.sources && Array.isArray(m.sources)) {
      for (const s of m.sources) {
        if (!seenIndices.has(s.index)) {
          seenIndices.add(s.index);
          allSources.push(s);
        }
      }
    }
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to export the counseling summary to PDF.");
    return;
  }

  // Basic HTML formatter for markdown content
  const formatContentToHtml = (content: string): string => {
    let html = content
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Inline code
      .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;color:#4f46e5;padding:2px 4px;border-radius:4px;font-size:12px;">$1</code>')
      // Citations [n]
      .replace(/\[(\d+)\]/g, '<span style="display:inline-block;background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe;padding:1px 5px;border-radius:4px;font-size:10px;font-weight:bold;margin:0 2px;">[$1]</span>');

    // Split paragraphs and headers
    const lines = html.split("\n");
    const outputLines: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];

    const flushTableHtml = () => {
      if (tableRows.length === 0) return;
      let tableHtml = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;">';
      tableRows.forEach((r, idx) => {
        const cells = r.split("|").map((c) => c.trim()).filter((c, i, arr) => !(i === 0 && c === "") && !(i === arr.length - 1 && c === ""));
        if (cells.length === 0) return;
        if (idx === 0) {
          tableHtml += '<tr style="background:#1e1b4b;color:#ffffff;font-weight:bold;">' + cells.map((c) => `<th style="padding:6px 10px;border:1px solid #e5e7eb;text-align:left;">${c}</th>`).join("") + "</tr>";
        } else if (!/^[\s\-:|]+$/.test(r)) {
          const bg = idx % 2 === 0 ? "#ffffff" : "#f9fafb";
          tableHtml += `<tr style="background:${bg};">` + cells.map((c) => `<td style="padding:6px 10px;border:1px solid #e5e7eb;">${c}</td>`).join("") + "</tr>";
        }
      });
      tableHtml += "</table>";
      outputLines.push(tableHtml);
      tableRows = [];
      inTable = false;
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith("|")) {
        inTable = true;
        tableRows.push(line);
        continue;
      } else if (inTable) {
        flushTableHtml();
      }

      if (line.startsWith("### ")) {
        outputLines.push(`<h4 style="color:#111827;font-size:14px;margin:12px 0 6px 0;font-weight:bold;">${line.slice(4)}</h4>`);
      } else if (line.startsWith("## ")) {
        outputLines.push(`<h3 style="color:#111827;font-size:16px;margin:16px 0 8px 0;font-weight:bold;border-bottom:1px solid #e5e7eb;padding-bottom:4px;">${line.slice(3)}</h3>`);
      } else if (line.startsWith("# ")) {
        outputLines.push(`<h2 style="color:#111827;font-size:18px;margin:18px 0 10px 0;font-weight:bold;">${line.slice(2)}</h2>`);
      } else if (/^[-*•]\s+/.test(line)) {
        outputLines.push(`<li style="margin:4px 0 4px 18px;color:#374151;font-size:13px;line-height:1.6;">${line.replace(/^[-*•]\s+/, "")}</li>`);
      } else if (line) {
        outputLines.push(`<p style="margin:6px 0;color:#374151;font-size:13px;line-height:1.6;">${line}</p>`);
      }
    }
    flushTableHtml();

    return outputLines.join("\n");
  };

  let transcriptHtml = "";
  let qNum = 1;
  for (const m of messages) {
    if (m.role === "user") {
      transcriptHtml += `
        <div style="margin: 20px 0 10px 0; padding: 12px 16px; background: #eef2ff; border-left: 4px solid #4f46e5; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Student Query ${qNum++}</div>
          <div style="font-size: 14px; font-weight: 600; color: #1e1b4b; line-height: 1.5;">${m.content}</div>
        </div>
      `;
    } else {
      transcriptHtml += `
        <div style="margin: 0 0 24px 0; padding: 16px 18px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-size: 11px; font-weight: bold; color: #059669; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
            <span>Verified AI Counselor Guidance</span>
          </div>
          <div>${formatContentToHtml(m.content)}</div>
          ${
            m.sources && m.sources.length > 0
              ? `
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #f3f4f6; font-size: 11px; color: #6b7280;">
                <strong>Sources cited:</strong> ${m.sources.map((s) => `<span style="background:#f3f4f6;padding:2px 6px;border-radius:4px;margin-right:4px;">[${s.index}] ${s.title}</span>`).join(" ")}
              </div>
            `
              : ""
          }
        </div>
      `;
    }
  }

  let sourcesListHtml = "";
  if (allSources.length > 0) {
    sourcesListHtml = `
      <div style="margin: 24px 0; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; color: #111827; margin: 0 0 10px 0; letter-spacing: 0.05em;">
          Verified Knowledge Base References (${allSources.length})
        </h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
          ${allSources
            .map(
              (s) => `
            <div style="padding: 8px 12px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 11px;">
              <strong style="color: #4f46e5;">[${s.index}] ${s.title}</strong>
              <div style="color: #6b7280; margin-top: 2px;">Category: ${s.category.toUpperCase()} ${s.last_verified ? `| Verified: ${s.last_verified}` : ""}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  const printDocument = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title} — CareerVerse AI</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 20px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #4f46e5; margin-bottom: 20px;">
        <div>
          <div style="font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.02em;">CareerVerse AI</div>
          <div style="font-size: 12px; color: #6b7280; font-weight: 500;">24/7 Personal Career & Education Counselor</div>
          <h1 style="font-size: 18px; font-weight: bold; color: #111827; margin: 10px 0 0 0;">${title}</h1>
        </div>
        <div style="text-align: right; font-size: 11px; color: #6b7280;">
          <div><strong>Report Date:</strong> ${formatDate(exportDate)}</div>
          <div><strong>Student Queries:</strong> ${messages.filter((m) => m.role === "user").length}</div>
          <div style="margin-top: 8px;" class="no-print">
            <button onclick="window.print()" style="padding: 6px 14px; background: #4f46e5; color: #ffffff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Verified Sources -->
      ${sourcesListHtml}

      <!-- Transcript -->
      <div style="margin-top: 10px;">
        ${transcriptHtml}
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af;">
        Generated by CareerVerse AI Counselor • Base knowledge grounded on verified official exam and university patterns.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printDocument);
  printWindow.document.close();
};
