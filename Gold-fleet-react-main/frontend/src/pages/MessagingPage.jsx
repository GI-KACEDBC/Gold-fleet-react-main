import React, { useEffect, useState, useCallback } from 'react';
import { MessageLayout } from '../components/Messaging';
import { api } from '../services/api';

/**
 * Company Messaging Page
 * Modern LinkedIn-style messaging interface
 * For company users to communicate with platform admins
 */
export default function MessagingPage() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        // Get conversations list from API
        const response = await api.getMessages({ limit: 50 });
        
        // Transform API response to conversation objects
        const raw = response?.data || response?.messages || [];
        const messagesList = Array.isArray(raw) ? raw : (raw?.data || []);
        
        // Group by conversation (assuming messages have fromUser info)
        const convMap = {};
        messagesList.forEach((msg) => {
          if (!convMap[msg.id]) {
            convMap[msg.id] = {
              id: msg.id,
              participantId: msg.fromUser?.id,
              participantName: msg.from_type === 'platform' ? 'Platform Support' : msg.fromUser?.name || 'Support',
              participantAvatar: msg.fromUser?.avatar || null,
              participantRole: msg.from_type === 'platform' ? 'Administrator' : 'Support',
              isOnline: msg.from_type === 'platform',
              lastMessage: msg.message?.substring(0, 100) || msg.subject || '',
              timestamp: new Date(msg.created_at),
              unreadCount: !msg.read ? 1 : 0,
            };
          }
        });
        
        const convs = Object.values(convMap);
        setConversations(convs);
        
        // Select first conversation by default
        if (convs.length > 0 && !selectedConvId) {
          setSelectedConvId(convs[0].id);
        }
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load conversations');
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;

    const loadMessages = async () => {
      try {
        const response = await api.getMessage(selectedConvId);
        
        if (response.success && response.data) {
          // If it's a single message, wrap it in array
          const messageData = Array.isArray(response.data) ? response.data : [response.data];
          
          // Transform to message objects
          const transformedMessages = messageData.map((msg, idx) => ({
            id: msg.id || `msg-${idx}`,
            conversationId: selectedConvId,
            senderId: msg.from_type === 'platform' ? 'platform_admin' : 'company_user',
            senderName: msg.from_type === 'platform' ? 'Platform Admin' : msg.fromUser?.name || 'You',
            senderAvatar: msg.fromUser?.avatar || null,
            content: msg.message,
            text: msg.message,
            timestamp: new Date(msg.created_at),
          }));
          
          setMessages(transformedMessages);
        } else {
          setMessages([]);
        }
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load messages');
        console.error('Error loading messages:', err);
      }
    };

    loadMessages();
  }, [selectedConvId]);

  // Handle sending message
  const handleSendMessage = useCallback(async (messageText) => {
    if (!selectedConvId || !messageText.trim()) return;

    try {
      // Send message via API
      const response = await api.sendMessage({
        conversationId: selectedConvId,
        subject: 'Message',
        message: messageText,
      });

      if (response.success || response.data) {
        const newMessage = {
          id: response.data?.id || `msg-${Date.now()}`,
          conversationId: selectedConvId,
          senderId: 'company_user',
          senderName: 'You',
          senderAvatar: null,
          content: messageText,
          timestamp: new Date(),
        };

        // Add to local messages
        setMessages((prev) => [...prev, newMessage]);

        // Update conversation's last message
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConvId
              ? {
                  ...conv,
                  lastMessage: messageText,
                  timestamp: new Date(),
                  unreadCount: 0,
                }
              : conv
          )
        );

        setError('');
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
    }
  }, [selectedConvId]);

  // Handle search
  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      return; // Reset to show all conversations
    }

    // Filter conversations based on search query
    setConversations((prev) =>
      prev.filter((conv) => {
        const name = (conv.participantName || '').toLowerCase();
        const msg = (conv.lastMessage || '').toLowerCase();
        const q = query.toLowerCase();
        return name.includes(q) || msg.includes(q);
      })
    );
  }, []);

  // Handle conversation selection
  const handleSelectConversation = useCallback((convId) => {
    setSelectedConvId(convId);
    setError('');
  }, []);

  return (
    <div className="h-screen bg-white">
      <MessageLayout
        conversations={conversations}
        messages={messages}
        currentUserId={currentUser?.id || 'company_user'}
        selectedConversationId={selectedConvId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        onSearch={handleSearch}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}
