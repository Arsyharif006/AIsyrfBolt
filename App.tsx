import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Conversation, Message, MessageSender } from './types';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import { FiArrowDown } from 'react-icons/fi';
import * as storage from './services/storageService';
import { sendMessageToWebhook } from './services/n8nService';
import { Sidebar } from './components/Sidebar';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { Welcome } from './components/Welcome';
import { Settings } from './components/Setting';
import { useLocalization } from './contexts/LocalizationContext';

function App() {
  const { t } = useLocalization();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile overlay state
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop collapse state
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConversations(storage.getConversations());
  }, []);

  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, activeConversationId, view]);

  // Handle scroll button visibility
  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom && scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setView('chat');
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setView('chat');
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      storage.deleteConversation(id);
      const updatedConversations = conversations.filter((c) => c.id !== id);
      setConversations(updatedConversations);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [conversations, activeConversationId]
  );

  const handleDeleteAllConversations = useCallback(() => {
    storage.deleteAllConversations();
    setConversations([]);
    setActiveConversationId(null);
    setView('chat');
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      setIsLoading(true);

      const userMessage: Message = {
        id: crypto.randomUUID(),
        text,
        sender: MessageSender.User,
      };

      let conversationId = activeConversationId;
      let currentConversation = activeConversation;

      if (!currentConversation) {
        const newConv: Conversation = {
          id: crypto.randomUUID(),
          title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
          messages: [],
          createdAt: new Date().toISOString(),
        };
        currentConversation = newConv;
        conversationId = newConv.id;
        setActiveConversationId(newConv.id);
      }

      const aiLoadingMessage: Message = {
        id: crypto.randomUUID(),
        text: '...',
        sender: MessageSender.AI,
      };

      const updatedMessages = [...currentConversation.messages, userMessage, aiLoadingMessage];

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversationId);
        if (existing) {
          return prev.map((c) => (c.id === conversationId ? { ...c, messages: updatedMessages } : c));
        } else {
          return [{ ...currentConversation!, messages: updatedMessages }, ...prev];
        }
      });

      const aiResponseText = await sendMessageToWebhook(text);

      setConversations((prev) => {
        const finalConvs = prev.map((c) => {
          if (c.id === conversationId) {
            const finalMessages = c.messages.map((m) =>
              m.id === aiLoadingMessage.id ? { ...m, text: aiResponseText } : m
            );
            const finalConversation = { ...c, messages: finalMessages };
            storage.saveConversation(finalConversation);
            return finalConversation;
          }
          return c;
        });
        return finalConvs;
      });

      setIsLoading(false);
    },
    [activeConversation, activeConversationId]
  );

  const handleEditMessage = useCallback(async (messageId: string, newText: string) => {
    const conversationId = activeConversationId;
    if (!conversationId || !activeConversation) return;

    // Find the exact index of the message being edited.
    const messageIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      console.error("Could not find the message to edit.");
      return;
    }

    // Remove the edited message and all subsequent messages
    // to start a new branch of the conversation, as requested.
    const truncatedMessages = activeConversation.messages.slice(0, messageIndex);

    // Create the new user message with the edited text, reusing the original ID.
    const editedUserMessage: Message = {
      id: messageId,
      text: newText,
      sender: MessageSender.User,
    };

    // Create a temporary loading message for the AI's new response.
    const aiLoadingMessage: Message = {
      id: crypto.randomUUID(),
      text: '...',
      sender: MessageSender.AI,
    };

    // Immediately update the UI to show the new conversation branch.
    const updatedMessages = [...truncatedMessages, editedUserMessage, aiLoadingMessage];
    
    // Create a snapshot of the conversations before the API call for potential rollback.
    const previousConversations = conversations;

    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, messages: updatedMessages } : conv
      )
    );
    setIsLoading(true);

    try {
      const aiResponseText = await sendMessageToWebhook(newText);
      
      // Replace the loading message with the actual AI response.
      setConversations(prev => {
        const finalConvs = prev.map(conv => {
          if (conv.id === conversationId) {
            const finalMessages = conv.messages.map(m =>
              m.id === aiLoadingMessage.id ? { ...m, text: aiResponseText } : m
            );
            const finalConversation = { ...conv, messages: finalMessages };
            storage.saveConversation(finalConversation); // Save the final state
            return finalConversation;
          }
          return conv;
        });
        return finalConvs;
      });

    } catch (error) {
      console.error("Failed to get AI response after editing:", error);
      // On error, revert the conversation to its state before the edit.
      setConversations(previousConversations);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, activeConversation, conversations]);

  const handleResendMessage = useCallback(
    (text: string) => {
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  const handlePromptClick = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  return (
    <div className="flex h-screen bg-gray-800 font-sans">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => {
          setView('settings');
        }}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex-1 flex flex-col bg-gray-900 text-white overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-gray-900 text-white border-b border-gray-700/50 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-300 hover:text-white">
              <HiOutlineMenuAlt3  />
          </button>
          <h1 className="text-lg font-semibold truncate">{activeConversation?.title || t('newChat')}</h1>
          <div className="w-6"></div> {/* Spacer to balance the burger button */}
        </header>

        {view === 'settings' ? (
          <Settings onClose={() => setView('chat')} onDeleteAll={handleDeleteAllConversations} />
        ) : (
          <>
            <main ref={mainContainerRef} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
              <div className="max-w-4xl mx-auto h-full flex flex-col">
                {activeConversation && activeConversation.messages.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {activeConversation.messages.map((msg, index) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        isLoading={isLoading && msg.sender === MessageSender.AI && msg.text === '...'}
                        onResendMessage={handleResendMessage}
                        onEditMessage={handleEditMessage}
                        shouldHideButtons={activeConversation.messages.length - index > 10}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <Welcome onPromptClick={handlePromptClick} />
                )}
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-24 right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
                  aria-label="Scroll to bottom"
                >
                  <FiArrowDown size={20} />
                </button>
              )}
            </main>
            <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 bg-gray-900">
              <div className="max-w-4xl mx-auto">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;