import React, { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

/**
 * ChatWindow Component
 * Main chat display area with header, messages, and input
 */
export default function ChatWindow({
  conversation = {},
  messages = [],
  currentUserId = null,
  onSendMessage = () => {},
  isLoading = false,
  error = null,
}) {
  const messagesEndRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom only when NEW messages arrive, not on initial load
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && messages.length > 0) {
      const messageContainer = messagesEndRef.current?.parentElement;
      if (messageContainer) {
        // Scroll the messages container, not the window
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = {};

    msgs.forEach((msg) => {
      const date = new Date(msg.timestamp || msg.createdAt);
      const dateKey = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return groups;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <ChatHeader conversation={conversation} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-white px-6 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-2 text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No messages yet</p>
              <p className="text-gray-400 text-sm">Start a conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
              <div key={dateKey}>
                {/* Date Separator */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {dateKey}
                  </span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {msgs.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isSent={message.senderId === currentUserId}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-6 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
