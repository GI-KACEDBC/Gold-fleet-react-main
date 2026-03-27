import React, { useState, useCallback } from 'react';
import MessageLayout from './MessageLayout';

/**
 * MessagingDemo Component
 * Example implementation showing how to use MessageLayout with mock data
 * This demonstrates proper data structure and integration patterns
 */
export default function MessagingDemo() {
  // Mock current user
  const currentUser = {
    id: 'user-1',
    name: 'John Doe',
    avatar: null,
  };

  // Mock conversations data
  const [conversations, setConversations] = useState([
    {
      id: 'conv-1',
      participantId: 'user-2',
      participantName: 'Sarah Johnson',
      participantAvatar: null,
      participantRole: 'Product Manager',
      isOnline: true,
      lastMessage: 'That sounds great! Let me check with the team.',
      timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      unreadCount: 2,
    },
    {
      id: 'conv-2',
      participantId: 'user-3',
      participantName: 'Michael Chen',
      participantAvatar: null,
      participantRole: 'Designer',
      isOnline: false,
      lastMessage: `I've uploaded the new designs to Figma`,
      timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      unreadCount: 0,
    },
    {
      id: 'conv-3',
      participantId: 'user-4',
      participantName: 'Emily Rodriguez',
      participantAvatar: null,
      participantRole: 'Developer',
      isOnline: true,
      lastMessage: 'The API is ready for testing',
      timestamp: new Date(Date.now() - 1 * 86400000), // 1 day ago
      unreadCount: 1,
    },
  ]);

  // Mock messages for selected conversation
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderId: 'user-2',
      senderName: 'Sarah Johnson',
      senderAvatar: null,
      content: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 30 * 60000),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      senderId: 'user-1',
      senderName: 'John Doe',
      senderAvatar: null,
      content: 'Hi Sarah! Doing great, how about you?',
      timestamp: new Date(Date.now() - 25 * 60000),
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      senderId: 'user-2',
      senderName: 'Sarah Johnson',
      senderAvatar: null,
      content: 'That sounds great! Let me check with the team.',
      timestamp: new Date(Date.now() - 5 * 60000),
    },
  ]);

  const [selectedConvId, setSelectedConvId] = useState('conv-1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle conversation selection
  const handleSelectConversation = useCallback((convId) => {
    setSelectedConvId(convId);
    setError(null);
    
    // In a real app, you would fetch messages for this conversation from your API
    // Example:
    // fetchMessages(convId);
    
    // For demo, show different message sets
    if (convId === 'conv-2') {
      setMessages([
        {
          id: 'msg-4',
          conversationId: 'conv-2',
          senderId: 'user-3',
          senderName: 'Michael Chen',
          senderAvatar: null,
          content: "I've uploaded the new designs to Figma",
          timestamp: new Date(Date.now() - 2 * 3600000),
        },
        {
          id: 'msg-5',
          conversationId: 'conv-2',
          senderId: 'user-1',
          senderName: 'John Doe',
          senderAvatar: null,
          content: 'Thanks! Will review them today',
          timestamp: new Date(Date.now() - 1 * 3600000),
        },
      ]);
    } else if (convId === 'conv-3') {
      setMessages([
        {
          id: 'msg-6',
          conversationId: 'conv-3',
          senderId: 'user-4',
          senderName: 'Emily Rodriguez',
          senderAvatar: null,
          content: 'The API is ready for testing',
          timestamp: new Date(Date.now() - 24 * 3600000),
        },
      ]);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = useCallback(async (messageText) => {
    if (!selectedConvId || !messageText.trim()) return;

    // Simulate API call
    setIsLoading(true);
    try {
      // In a real app, make API call here:
      // await api.sendMessage(selectedConvId, { content: messageText });
      
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add message to local state (in real app, this would come from API response)
      const newMessage = {
        id: `msg-${Date.now()}`,
        conversationId: selectedConvId,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar,
        content: messageText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Update last message in conversation
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConvId
            ? {
                ...conv,
                lastMessage: messageText,
                timestamp: new Date(),
              }
            : conv
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [selectedConvId]);

  // Handle search
  const handleSearch = useCallback((query) => {
    // In a real app, filter conversations based on search query
    // This could be done locally or by calling an API
    console.log('Search query:', query);
  }, []);

  return (
    <MessageLayout
      conversations={conversations}
      messages={messages}
      currentUserId={currentUser.id}
      selectedConversationId={selectedConvId}
      onSelectConversation={handleSelectConversation}
      onSendMessage={handleSendMessage}
      onSearch={handleSearch}
      isLoading={isLoading}
      error={error}
    />
  );
}
