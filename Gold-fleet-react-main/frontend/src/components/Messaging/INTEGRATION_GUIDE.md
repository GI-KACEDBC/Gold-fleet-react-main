/**
 * Integration Examples
 * 
 * This file shows how to integrate the new MessageLayout component
 * into your existing company and platform messaging pages.
 */

// ============================================================================
// COMPANY SIDE MESSAGING PAGE - Example Integration
// ============================================================================
// Location: frontend/src/pages/CompanyMessagingPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // Your auth context
import { api } from '../services/api'; // Your API service
import { MessageLayout } from '../components/Messaging';

export default function CompanyMessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        // Call your API to get all conversations for this company
        const response = await api.get('/api/company/conversations');
        const data = response.data || [];
        
        setConversations(data);
        
        // Set first conversation as selected if available
        if (data.length > 0) {
          setSelectedConvId(data[0].id);
        }
        setError(null);
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
        const response = await api.get(`/api/company/conversations/${selectedConvId}/messages`);
        const data = response.data || [];
        
        setMessages(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
        console.error('Error loading messages:', err);
      }
    };

    loadMessages();
  }, [selectedConvId]);

  // Handle sending message
  const handleSendMessage = useCallback(async (messageText) => {
    if (!selectedConvId) return;

    try {
      // Send message via API
      const response = await api.post(
        `/api/company/conversations/${selectedConvId}/messages`,
        {
          content: messageText,
          senderId: user.id,
          senderName: user.name,
          senderAvatar: user.avatar
        }
      );

      const newMessage = response.data;
      
      // Add to local state
      setMessages((prev) => [...prev, newMessage]);

      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConvId
            ? {
                ...conv,
                lastMessage: messageText,
                timestamp: new Date()
              }
            : conv
        )
      );

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to send message');
      console.error('Error sending message:', err);
    }
  }, [selectedConvId, user.id, user.name, user.avatar]);

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    // You can add actual search API call here
    // For now, component handles local filtering
  }, []);

  return (
    <div className="h-screen bg-white">
      <MessageLayout
        conversations={conversations}
        messages={messages}
        currentUserId={user?.id}
        selectedConversationId={selectedConvId}
        onSelectConversation={setSelectedConvId}
        onSendMessage={handleSendMessage}
        onSearch={handleSearch}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}

// ============================================================================
// PLATFORM SIDE MESSAGING PAGE - Example Integration
// ============================================================================
// Location: frontend/src/pages/PlatformMessagingPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MessageLayout } from '../components/Messaging';
import { useSocket } from '../hooks/useSocket'; // Optional: for real-time updates

export default function PlatformMessagingPage() {
  const { user } = useAuth();
  const socket = useSocket(); // Optional: for real-time features
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all conversations (admin can view all)
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        // Platform admin can see all conversations
        const response = await api.get('/api/admin/conversations');
        const data = response.data || [];
        
        setConversations(data);
        
        if (data.length > 0) {
          setSelectedConvId(data[0].id);
        }
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load conversations');
        console.error('Error:', err);
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
        const response = await api.get(
          `/api/admin/conversations/${selectedConvId}/messages`
        );
        const data = response.data || [];
        
        setMessages(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load messages');
      }
    };

    loadMessages();
  }, [selectedConvId]);

  // Listen for real-time messages (optional)
  useEffect(() => {
    if (!socket || !selectedConvId) return;

    socket.on(`conversation:${selectedConvId}:new-message`, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off(`conversation:${selectedConvId}:new-message`);
    };
  }, [socket, selectedConvId]);

  // Handle sending message
  const handleSendMessage = useCallback(async (messageText) => {
    if (!selectedConvId) return;

    try {
      const response = await api.post(
        `/api/admin/conversations/${selectedConvId}/messages`,
        {
          content: messageText,
          senderId: user.id,
          senderName: user.name,
          senderAvatar: user.avatar
        }
      );

      const newMessage = response.data;
      
      setMessages((prev) => [...prev, newMessage]);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConvId
            ? {
                ...conv,
                lastMessage: messageText,
                timestamp: new Date()
              }
            : conv
        )
      );

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    }
  }, [selectedConvId, user.id, user.name, user.avatar]);

  // Handle search
  const handleSearch = useCallback((query) => {
    // Optional: add API search
    console.log('Search query:', query);
  }, []);

  return (
    <div className="h-screen bg-white">
      <MessageLayout
        conversations={conversations}
        messages={messages}
        currentUserId={user?.id}
        selectedConversationId={selectedConvId}
        onSelectConversation={setSelectedConvId}
        onSendMessage={handleSendMessage}
        onSearch={handleSearch}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}

// ============================================================================
// API SERVICE EXTENSIONS
// ============================================================================
// Add these methods to your api.js/api.ts service file

// For Company Users
export const companyMessagingAPI = {
  // Get all conversations for company
  async getConversations() {
    return api.get('/api/company/conversations');
  },

  // Get messages for specific conversation
  async getMessages(conversationId) {
    return api.get(`/api/company/conversations/${conversationId}/messages`);
  },

  // Send a new message
  async sendMessage(conversationId, payload) {
    return api.post(
      `/api/company/conversations/${conversationId}/messages`,
      payload
    );
  },

  // Mark conversation as read
  async markAsRead(conversationId) {
    return api.put(`/api/company/conversations/${conversationId}/read`);
  },

  // Search conversations
  async searchConversations(query) {
    return api.get('/api/company/conversations/search', {
      params: { q: query }
    });
  }
};

// For Platform Admin Users
export const adminMessagingAPI = {
  // Get all conversations (admin only)
  async getConversations(filters = {}) {
    return api.get('/api/admin/conversations', {
      params: filters
    });
  },

  // Get messages for specific conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    return api.get(`/api/admin/conversations/${conversationId}/messages`, {
      params: { page, limit }
    });
  },

  // Send a new message as admin
  async sendMessage(conversationId, payload) {
    return api.post(
      `/api/admin/conversations/${conversationId}/messages`,
      payload
    );
  },

  // Mark conversation as read
  async markAsRead(conversationId) {
    return api.put(`/api/admin/conversations/${conversationId}/read`);
  },

  // Get conversation with full details
  async getConversationDetails(conversationId) {
    return api.get(`/api/admin/conversations/${conversationId}`);
  },

  // Search across all conversations
  async searchConversations(query) {
    return api.get('/api/admin/conversations/search', {
      params: { q: query }
    });
  }
};

// ============================================================================
// ROUTING SETUP
// ============================================================================
// Update your router configuration to include these pages

import { Route, Routes } from 'react-router-dom';
import CompanyMessagingPage from './pages/CompanyMessagingPage';
import PlatformMessagingPage from './pages/PlatformMessagingPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Company routes */}
      <Route path="/company/messages" element={<CompanyMessagingPage />} />
      
      {/* Admin/Platform routes */}
      <Route path="/admin/messages" element={<PlatformMessagingPage />} />
    </Routes>
  );
}

// ============================================================================
// RESPONSIVE LAYOUT WRAPPER (Optional)
// ============================================================================
// If you want to add responsive behavior for mobile

import { useState } from 'react';

export function ResponsiveMessageLayout(props) {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile: Sidebar toggle button */}
      <div className="md:hidden absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ☰
        </button>
      </div>

      {/* Sidebar - hidden on mobile */}
      <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-full md:w-[30%]`}>
        {/* Conversation list */}
      </div>

      {/* Chat - full width on mobile */}
      <div className={`${showSidebar ? 'hidden' : 'block'} md:block flex-1`}>
        {/* Chat content */}
      </div>
    </div>
  );
}
