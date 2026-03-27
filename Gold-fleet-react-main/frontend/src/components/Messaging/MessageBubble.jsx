import React from 'react';

/**
 * MessageBubble Component
 * Individual message with styling for sent/received messages
 */
export default function MessageBubble({
  message = {},
  isSent = false,
}) {
  const {
    id,
    content = '',
    text = '',
    timestamp = null,
    senderName = 'User',
    senderAvatar = null,
  } = message;

  const messageText = content || text;

  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (isSent) {
    // SENT MESSAGE - Right aligned, light gray
    return (
      <div key={id} className="flex justify-end">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tr-md px-4 py-2 shadow-sm">
            <p className="text-sm break-words">{messageText}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {formatTime(timestamp)}
          </p>
        </div>
      </div>
    );
  }

  // RECEIVED MESSAGE - Left aligned, yellow/gold gradient
  return (
    <div key={id} className="flex justify-start">
      <div className="flex gap-2 max-w-xs lg:max-w-md">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xs font-semibold">
              {senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Message Bubble */}
        <div>
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-2xl rounded-tl-md px-4 py-2 shadow-sm">
            <p className="text-sm break-words">{messageText}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}
