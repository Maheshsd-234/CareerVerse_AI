import React, { useState } from "react";
import { Sparkles, ArrowRight, CornerDownLeft } from "lucide-react";
import { Button } from "../ui/UI";

interface NaturalLanguageBarProps {
  onSendCommand: (commandText: string) => Promise<void>;
  isLoading: boolean;
}

export const NaturalLanguageBar: React.FC<NaturalLanguageBarProps> = ({
  onSendCommand,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    const text = prompt.trim();
    setPrompt("");
    await onSendCommand(text);
  };

  const suggestions = [
    "I have only 5 hours this week",
    "I already know SQL",
    "Focus on interview prep",
    "Switch to MVCP fast-track",
  ];

  return (
    <div className="bg-[#181836] border border-white/10 rounded-3xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-semibold">
        <Sparkles size={14} />
        <span>Roadmap Copilot · Natural-Language Commands</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Copilot, e.g. 'I have only 6 hours this week', 'Focus on projects', 'I already know Python'..."
          disabled={isLoading}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 font-body"
        />
        <Button
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs px-4 rounded-2xl flex items-center gap-1.5 cursor-pointer"
        >
          <span>Update</span>
          <CornerDownLeft size={13} />
        </Button>
      </form>

      {/* Quick suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-mono text-gray-500 mr-1">Quick Actions:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendCommand(s)}
            className="text-[11px] font-mono text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            "{s}"
          </button>
        ))}
      </div>
    </div>
  );
};
