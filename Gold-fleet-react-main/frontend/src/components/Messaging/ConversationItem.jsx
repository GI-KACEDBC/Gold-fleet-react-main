import React from 'react';

/**
 * ConversationItem Component
 * Individual conversation in the sidebar
 * Shows avatar, name, last message preview, and timestamp
 */
export default function ConversationItem({
  conversation = {},
  isSelected = false,
  onSelect = () => {},
}) {
  const {
    id,
    participantName = 'User',
    participantAvatar = null,
    lastMessage = '',
    timestamp = null,
    unreadCount = 0,
  } = conversation;

  // Format timestamp
  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now - msgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full px-4 py-3 text-left border-b border-gray-100 transition-all hover:bg-gray-50 ${
        isSelected ? 'bg-yellow-50 border-l-4 border-l-yellow-600' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {participantAvatar ? (
            <img
              src={participantAvatar}
              alt={participantName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-semibold text-sm">
              {participantName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {participantName}
            </h3>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatTime(timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{lastMessage}</p>
        </div>

        {/* Unread Indicator */}
        {unreadCount > 0 && (
          <div className="flex-shrink-0 flex items-center">
            <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-semibold text-white bg-yellow-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
