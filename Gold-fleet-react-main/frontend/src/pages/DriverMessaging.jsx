import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageLayout } from '../components/Messaging';
import { api } from '../services/api';

/**
 * Driver Messaging Page
 * Modern LinkedIn-style messaging interface for drivers
 * Drivers communicate with their company admin for support
 */
export default function DriverMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        // Get messages list from API
        const response = await api.getMessages({ limit: 50 });
        
        // Transform API response to conversation objects
        const raw = response?.data || response?.messages || [];
        const messagesList = Array.isArray(raw) ? raw : (raw?.data || []);
        
        // Group by conversation - for drivers, we typically have one conversation with company admin
        const convMap = {};
        messagesList.forEach((msg) => {
          const convId = msg.company_id || 'company_support';
          if (!convMap[convId]) {
            convMap[convId] = {
              id: convId,
              participantId: msg.toUser?.id || 'admin',
              participantName: msg.to_type === 'company' ? 'Company Support' : msg.toUser?.name || 'Support',
              participantAvatar: msg.toUser?.avatar || null,
              participantRole: msg.to_type === 'company' ? 'Administrator' : 'Support',
              isOnline: msg.to_type === 'company',
              lastMessage: msg.message?.substring(0, 100) || msg.subject || '',
              timestamp: new Date(msg.created_at),
              unreadCount: !msg.read ? 1 : 0,
            };
          }
        });
        
        const convs = Object.values(convMap);
        setConversations(convs);
        
        // Select first conversation by default (or create default company admin conversation)
        if (convs.length > 0 && !selectedConvId) {
          setSelectedConvId(convs[0].id);
        } else if (convs.length === 0) {
          // Create default conversation with company admin
          const defaultConv = {
            id: 'company_support',
            participantId: 'admin',
            participantName: 'Company Support',
            participantAvatar: null,
            participantRole: 'Administrator',
            isOnline: true,
            lastMessage: 'Welcome! Send a message to reach your company admin.',
            timestamp: new Date(),
            unreadCount: 0,
          };
          setConversations([defaultConv]);
          setSelectedConvId(defaultConv.id);
        }
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load conversations');
        console.error('Error loading conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user]);

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
            senderId: msg.from_type === 'company' ? 'company_admin' : 'driver',
            senderName: msg.from_type === 'company' ? 'Company Admin' : msg.fromUser?.name || 'You',
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
        console.error('Error loading messages:', err);
        // Don't set error here - use empty messages instead
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
          senderId: 'driver',
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
        currentUserId={user?.id || 'driver'}
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
