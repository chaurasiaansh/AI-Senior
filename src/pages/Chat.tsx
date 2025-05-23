import React, { useState } from "react";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import {
  generateResponse,
  getYouTubeRecommendations,
  analyzeFile,
} from "../lib/api";

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export const Chat: React.FC = () => {
  // const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I'm your AI assistant. I can help you with general questions, YouTube recommendations, and analyze resumes or syllabi. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      // Check if it's a YouTube search request
      if (
        content.toLowerCase().includes("youtube") ||
        content.toLowerCase().includes("video")
      ) {
        const { videos } = await getYouTubeRecommendations(content);
        const videoList = videos
          .map((video: any) => `${video.title}\n${video.url}`)
          .join("\n\n");

        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `Here are some relevant videos:\n\n${videoList}`,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      } else {
        // General query
        const { response } = await generateResponse(content);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: `Uploaded file: ${file.name}`,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const fileType = file.name.toLowerCase().includes("syllabus")
        ? "syllabus"
        : "resume";
      const { result } = await analyzeFile(file, fileType);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: result,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I encountered an error analyzing your file. Please try again.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.content}
            isBot={message.isBot}
            timestamp={message.timestamp}
          />
        ))}
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-2 p-3">
            <div
              className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        )}
      </div>
      {/* Chat Input Box */}
      <div className="p-4 border-t bg-white shadow-md w-full">
        <ChatInput
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};
