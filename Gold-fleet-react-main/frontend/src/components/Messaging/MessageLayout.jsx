import React, { useState } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

/**
 * MessageLayout Component
 * Main container for LinkedIn-style messaging UI
 * Splits layout into 30% sidebar (conversations) and 70% chat area
 */
export default function MessageLayout({
  conversations = [],
  messages = [],
  currentUserId = null,
  selectedConversationId = null,
  onSelectConversation = () => {},
  onSendMessage = () => {},
  onSearch = () => {},
  isLoading = false,
  error = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedConversationId
  );

  const handleSearch = (query) => {
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* LEFT SIDEBAR - Conversations List (30%) */}
      <div className="w-[30%] border-r border-gray-200 flex flex-col">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          onSearch={handleSearch}
          isLoading={isLoading}
          searchQuery={searchQuery}
        />
      </div>

      {/* RIGHT CHAT AREA (70%) */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
