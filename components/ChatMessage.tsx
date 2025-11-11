import React, { useEffect, useState } from 'react';
import { Message, MessageSender } from '../types';
import { FiUser, FiRefreshCw, FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import { CodeBlock } from './CodeBlock';
import { Table } from './Table';
import { useLocalization } from '../contexts/LocalizationContext';
import icon from './images/icon.png';

interface ChatMessageProps {
  message: Message;
  isLoading: boolean;
  onResendMessage: (message: string) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  shouldHideButtons?: boolean;
}

// ✅ Global edit manager agar hanya 1 bubble bisa diedit
let __globalEditingId: string | null = null;
const EMIT_EDIT_CHANGE = (id: string | null) =>
  window.dispatchEvent(new CustomEvent('chat-edit-change', { detail: id }));

const parseAiResponse = (text: string) => {
  if (!text) return [];

  const components: { type: 'text' | 'code' | 'table'; content: any }[] = [];

  // Deteksi tabel dengan lebih akurat
  const tableRegex = /(\|[^\n]+\|\n\|[\s:|-]+\|\n(?:\|[^\n]+\|\n?)+)/g;
  let lastIndex = 0;
  let match;

  while ((match = tableRegex.exec(text)) !== null) {
    // Tambahkan teks sebelum tabel
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index).trim();
      if (beforeText) {
        // Check for code blocks in the text
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        let codeMatch;
        let textLastIndex = 0;

        while ((codeMatch = codeBlockRegex.exec(beforeText)) !== null) {
          // Add text before code block
          if (codeMatch.index > textLastIndex) {
            const textPart = beforeText.substring(textLastIndex, codeMatch.index).trim();
            if (textPart) {
              const cleanedText = textPart
                .replace(/^(#+)\s/gm, '')
                .replace(/\*\*/g, '')
                .replace(/`/g, '')
                .replace(/^\s*[-*]\s/gm, '• ');
              if (cleanedText) {
                components.push({ type: 'text', content: cleanedText });
              }
            }
          }

          // Add code block
          components.push({
            type: 'code',
            content: { language: codeMatch[1], code: codeMatch[2].trim() },
          });

          textLastIndex = codeMatch.index + codeMatch[0].length;
        }

        // Add remaining text after last code block
        if (textLastIndex < beforeText.length) {
          const textPart = beforeText.substring(textLastIndex).trim();
          if (textPart) {
            const cleanedText = textPart
              .replace(/^(#+)\s/gm, '')
              .replace(/\*\*/g, '')
              .replace(/`/g, '')
              .replace(/^\s*[-*]\s/gm, '• ');
            if (cleanedText) {
              components.push({ type: 'text', content: cleanedText });
            }
          }
        }
      }
    }

    // Parse tabel
    try {
      const tableText = match[1];
      const lines = tableText.trim().split('\n').filter(line => line.trim());

      if (lines.length >= 2) {
        // Header
        const headers = lines[0]
          .split('|')
          .map(h => h.trim())
          .filter(Boolean);

        // Data rows (skip separator line)
        const rows = lines.slice(2)
          .map(row =>
            row.split('|')
              .map(c => c.trim())
              .filter(Boolean)
          )
          .filter(row => row.length > 0);

        if (headers.length > 0 && rows.length > 0) {
          components.push({ type: 'table', content: { headers, rows } });
        }
      }
    } catch (error) {
      console.error('Error parsing table:', error);
    }

    lastIndex = match.index + match[0].length;
  }

  // Tambahkan teks setelah tabel terakhir
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex).trim();
    if (afterText) {
      // Check for code blocks
      const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
      let codeMatch;
      let textLastIndex = 0;

      while ((codeMatch = codeBlockRegex.exec(afterText)) !== null) {
        // Add text before code block
        if (codeMatch.index > textLastIndex) {
          const textPart = afterText.substring(textLastIndex, codeMatch.index).trim();
          if (textPart) {
            const cleanedText = textPart
              .replace(/^(#+)\s/gm, '')
              .replace(/\*\*/g, '')
              .replace(/`/g, '')
              .replace(/^\s*[-*]\s/gm, '• ');
            if (cleanedText) {
              components.push({ type: 'text', content: cleanedText });
            }
          }
        }

        // Add code block
        components.push({
          type: 'code',
          content: { language: codeMatch[1], code: codeMatch[2].trim() },
        });

        textLastIndex = codeMatch.index + codeMatch[0].length;
      }

      // Add remaining text
      if (textLastIndex < afterText.length) {
        const textPart = afterText.substring(textLastIndex).trim();
        if (textPart) {
          const cleanedText = textPart
            .replace(/^(#+)\s/gm, '')
            .replace(/\*\*/g, '')
            .replace(/`/g, '')
            .replace(/^\s*[-*]\s/gm, '• ');
          if (cleanedText) {
            components.push({ type: 'text', content: cleanedText });
          }
        }
      }
    }
  }

  // Fallback: jika tidak ada komponen terdeteksi, return text biasa
  if (components.length === 0 && text.trim()) {
    const cleanedText = text
      .replace(/^(#+)\s/gm, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/^\s*[-*]\s/gm, '• ');
    if (cleanedText.trim()) {
      components.push({ type: 'text', content: cleanedText });
    }
  }

  return components;
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isLoading,
  onResendMessage,
  onEditMessage,
  shouldHideButtons = false,
}) => {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [globalEditingId, setGlobalEditingId] = useState<string | null>(
    __globalEditingId
  );

  useEffect(() => {
    setEditText(message.text);
  }, [message.text]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | null;
      __globalEditingId = detail;
      setGlobalEditingId(detail);

      if (detail !== message.id && isEditingLocal) {
        setIsEditingLocal(false);
        setEditText(message.text);
      }
    };

    window.addEventListener('chat-edit-change', handler);
    return () => window.removeEventListener('chat-edit-change', handler);
  }, [isEditingLocal, message.id, message.text]);

  const startEditing = () => {
    __globalEditingId = message.id;
    EMIT_EDIT_CHANGE(message.id);
    setIsEditingLocal(true);
  };

  const stopEditing = (shouldReset = true) => {
    __globalEditingId = null;
    EMIT_EDIT_CHANGE(null);
    setIsEditingLocal(false);
    if (shouldReset) setEditText(message.text);
  };

  const handleSaveEdit = () => {
    if (onEditMessage && editText.trim() !== '') {
      onEditMessage(message.id, editText.trim());
    }
    stopEditing(false);
  };

  const anyEditingActive = Boolean(globalEditingId);
  const { t } = useLocalization();

  // ---------- Render User Message ----------
  if (message.sender === MessageSender.User) {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-start gap-3 sm:gap-4 justify-end w-full">
          <div
            className={`transition-all duration-200 ${isEditingLocal
                ? 'w-full sm:w-3/4 bg-blue-700/70'
                : 'max-w-[85%] sm:max-w-xl lg:max-w-3xl bg-blue-600'
              } px-4 sm:px-5 py-3 rounded-2xl rounded-br-none group relative`}
          >
            {isEditingLocal ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-blue-800/50 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none min-h-[90px] text-sm sm:text-base"
                  rows={4}
                  aria-label="Edit message"
                  autoFocus
                />
                <div className="flex justify-end gap-2 text-sm">
                  <button
                    onClick={() => stopEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600 text-gray-200 transition"
                  >
                    <FiX size={14} />
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-blue-600 hover:brightness-95 transition"
                  >
                    <FiCheck size={14} />
                    {t('save')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-white text-sm sm:text-base leading-relaxed">
                {message.text}
              </p>
            )}

            {/* Ikon Refresh & Edit - Desktop Only */}
            {!shouldHideButtons && (
              <>
                <button
                  onClick={() => onResendMessage(message.text)}
                  title="Resend"
                  disabled={anyEditingActive}
                  className={`hidden sm:block absolute -left-10 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition ${anyEditingActive
                      ? 'opacity-40 cursor-not-allowed'
                      : 'opacity-0 group-hover:opacity-100 hover:bg-gray-700 text-gray-400 hover:text-white'
                    }`}
                >
                  <FiRefreshCw size={16} />
                </button>

                {!isEditingLocal && (
                  <button
                    onClick={startEditing}
                    title="Edit"
                    disabled={anyEditingActive}
                    className={`hidden sm:block absolute -left-10 top-[65%] p-1.5 rounded-full transition ${anyEditingActive
                        ? 'opacity-40 cursor-not-allowed'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-gray-700 text-gray-400 hover:text-white'
                      }`}
                  >
                    <FiEdit3 size={16} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Avatar User */}
          <div className="hidden md:flex w-8 h-8 rounded-full bg-gray-700 items-center justify-center overflow-hidden flex-shrink-0">
            <FiUser size={18} />
          </div>
        </div>

        {/* Tombol Mobile - Di Bawah Bubble */}
        {!isEditingLocal && !shouldHideButtons && (
          <div className="flex sm:hidden text-xs">
            <button
              onClick={() => onResendMessage(message.text)}
              disabled={anyEditingActive}
              className={`flex items-center px-2.5 py-1.5 rounded-lg transition ${anyEditingActive
                  ? 'opacity-40 cursor-not-allowed text-gray-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
            >
              <FiRefreshCw size={13} />
            </button>
            <button
              onClick={startEditing}
              disabled={anyEditingActive}
              className={`flex items-center px-2.5 py-1.5 rounded-lg transition ${anyEditingActive
                  ? 'opacity-40 cursor-not-allowed text-gray-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
            >
              <FiEdit3 size={13} />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---------- Render Loading State ----------
  if (isLoading) {
    return (
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="hidden md:flex w-8 h-8 rounded-full bg-gray-700 items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={icon}
            alt="AI"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-[85%] sm:max-w-xl lg:max-w-3xl px-4 sm:px-5 py-3 rounded-2xl bg-gray-700 rounded-bl-none">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="h-2 w-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0s]"></span>
            <span className="h-2 w-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.1s]"></span>
            <span className="h-2 w-2 bg-blue-400 rounded-full animate-pulse [animation-delay:0.2s]"></span>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Render AI Message ----------
  const aiResponseParts = parseAiResponse(message.text);

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="hidden md:flex w-8 h-8 rounded-full bg-gray-700 items-center justify-center overflow-hidden flex-shrink-0">
        <img
          src={icon}
          alt="AI"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="max-w-[100%] sm:max-w-xl lg:max-w-3xl w-full px-4 sm:px-5 py-3 rounded-bl-none">
        <div className="flex flex-col gap-4 text-white text-sm sm:text-base">
          {aiResponseParts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <p key={index} className="whitespace-pre-wrap leading-relaxed">
                  {part.content as string}
                </p>
              );
            }
            if (part.type === 'code') {
              const { language, code } = part.content as {
                language: string;
                code: string;
              };
              return <CodeBlock key={index} language={language} code={code} />;
            }
            if (part.type === 'table') {
              const { headers, rows } = part.content as {
                headers: string[];
                rows: (string | number)[][];
              };
              return <Table key={index} headers={headers} rows={rows} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};