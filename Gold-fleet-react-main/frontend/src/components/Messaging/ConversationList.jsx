import React from 'react';
import ConversationItem from './ConversationItem';

/**
 * ConversationList Component
 * Scrollable list of conversations with search functionality
 */
export default function ConversationList({
  conversations = [],
  selectedConversationId = null,
  onSelectConversation = () => {},
  onSearch = () => {},
  isLoading = false,
  searchQuery = '',
}) {
  const handleSearchChange = (e) => {
    const query = e.target.value;
    onSearch(query);
  };

  const filteredConversations = conversations.filter((conv) => {
    const name = (conv.participantName || conv.participant?.name || '').toLowerCase();
    const lastMessage = (conv.lastMessage || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || lastMessage.includes(query);
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:bg-white focus:border-yellow-600 transition-colors"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="mt-2">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {conversations.length === 0
              ? 'No conversations yet'
              : 'No conversations match your search'}
          </div>
        ) : (
          <div className="space-y-0">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedConversationId}
                onSelect={() => onSelectConversation(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
