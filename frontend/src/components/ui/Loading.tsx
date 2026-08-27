import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-[#4F46E5]/20 border-t-[#4F46E5] animate-spin`}
      />
    </div>
  );
};

export const LoadingCard: React.FC<{
  message?: string;
  subtext?: string;
}> = ({
  message = "Mapping your route...",
  subtext = "Calibrating milestone coordinates & real-time career insights",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-white/60 border border-dashed border-gray-300">
      {/* Wayfinding Route Track Animation */}
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full bg-[#4F46E5]/10 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F5A623] animate-ping" />
      </div>

      <p className="text-base font-display font-bold text-[#12122B] tracking-tight">
        {message}
      </p>
      {subtext && (
        <p className="mt-1 text-xs font-body text-[#6B7280] max-w-sm">
          {subtext}
        </p>
      )}
    </div>
  );
};

export const TypingAnimation: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#4F46E5]/10 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-[#4F46E5] typing-dot-1" />
      <span className="w-2 h-2 rounded-full bg-[#4F46E5] typing-dot-2" />
      <span className="w-2 h-2 rounded-full bg-[#4F46E5] typing-dot-3" />
    </div>
  );
};
