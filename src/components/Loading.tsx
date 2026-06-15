import React from "react";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
};

export const LoadingCard: React.FC<{ message?: string }> = ({
  message = "Fetching data...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  );
};

export const TypingAnimation: React.FC = () => {
  return (
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
    </div>
  );
};
