import React from "react";
import { Navbar } from "../components/Navbar";
import { ChatBot } from "../components/ChatBot";

export const ChatbotPage: React.FC = () => {
  return (
    <div className="-mx-4 -my-4 md:-mx-6 md:-my-6 h-[calc(100vh-64px)] min-h-0 flex flex-col">
      <ChatBot />
    </div>
  );
};
