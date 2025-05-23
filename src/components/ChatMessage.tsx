import React from 'react';
// import { Bot, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  timestamp: Date;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isBot, timestamp }) => {
  return (
    <div className={cn('flex w-full', isBot ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'flex items-end max-w-[75%] p-3 ',
          isBot ? ' text-black' : 'bg-blue-100 text-black rounded-lg shadow-md'
        )}
      >
        <div className="flex-1 space-y-1">
          <p className="text-sm">{message}</p>
          <p className="text-xs text-gray-600">
            {new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true,
            }).format(timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
};
