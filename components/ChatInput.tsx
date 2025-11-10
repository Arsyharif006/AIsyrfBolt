
import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const { t } = useLocalization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('sendMessagePlaceholder', { appName: t('appName') })}
        className="w-full bg-gray-800 text-white rounded-xl py-3 pl-4 pr-14 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-shadow"
        rows={1}
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className="absolute right-3 top-6 -translate-y-1/2 p-2 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
          <path d="M3.105 3.105a.75.75 0 01.956-.042l13.5 8.25a.75.75 0 010 1.372l-13.5 8.25a.75.75 0 01-1.11-.849L4.852 12.5H9.25a.75.75 0 000-1.5H4.852l-1.9-4.34a.75.75 0 01.153-.956z" />
        </svg>
      </button>
    </form>
  );
};
