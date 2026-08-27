import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 transition-all duration-200 ${
        hover
          ? "hover:border-[#4F46E5]/40 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "success" | "warning" | "milestone" | "growth" | "ink";
  className?: string;
}

const variantColors: Record<string, string> = {
  primary: "bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20",
  secondary: "bg-[#12122B]/10 text-[#12122B] border border-[#12122B]/15",
  accent: "bg-purple-100 text-purple-800 border border-purple-200",
  success: "bg-[#14B8A6]/15 text-[#0F766E] border border-[#14B8A6]/30",
  growth: "bg-[#14B8A6]/15 text-[#0F766E] border border-[#14B8A6]/30",
  warning: "bg-[#F5A623]/15 text-[#B45309] border border-[#F5A623]/30",
  milestone: "bg-[#F5A623]/15 text-[#B45309] border border-[#F5A623]/30 font-bold",
  ink: "bg-[#12122B] text-white",
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  className = "",
}) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-tight ${
        variantColors[variant] || variantColors.primary
      } ${className}`}
    >
      {children}
    </span>
  );
};

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "growth";
  size?: "sm" | "md" | "lg";
}

const variantClasses = {
  primary:
    "bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-sm hover:shadow active:scale-[0.98]",
  secondary:
    "bg-[#12122B] text-white hover:bg-[#1E1E42] shadow-sm active:scale-[0.98]",
  outline:
    "border-2 border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5]/5 active:scale-[0.98]",
  ghost:
    "text-[#12122B] hover:bg-gray-100 active:scale-[0.98]",
  growth:
    "bg-[#14B8A6] text-white hover:bg-[#0D9488] shadow-sm active:scale-[0.98]",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-lg",
  md: "px-4 py-2 text-sm font-semibold rounded-xl",
  lg: "px-6 py-3 text-base font-bold rounded-xl",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-display transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercent?: boolean;
  color?: "milestone" | "signal" | "growth";
  animate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercent = true,
  color = "milestone",
}) => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const barColor =
    color === "milestone"
      ? "bg-[#F5A623]"
      : color === "growth"
      ? "bg-[#14B8A6]"
      : "bg-[#4F46E5]";

  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium text-[#6B7280] font-body">{label}</span>}
          {showPercent && (
            <span className="text-xs font-data font-bold text-[#12122B]">
              {safeProgress}%
            </span>
          )}
        </div>
      )}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
