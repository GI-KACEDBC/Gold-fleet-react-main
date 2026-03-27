import { useState, useEffect, useRef, useCallback } from 'react';
import platformApi from '../services/platformApi';

/**
 * Custom Hook for Platform Real-time Message Notifications
 * Polls for new messages and triggers toast notifications
 */
export const usePlatformMessageNotifications = (isEnabled = true) => {
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const previousMessageCountRef = useRef(0);
  const pollIntervalRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await platformApi.getMessages(1, 100);
      
      // Extract messages list
      const messages = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

      // Count unread messages
      const messageUnreadCount = messages.filter(msg => !msg.read).length;
      setUnreadCount(messageUnreadCount);
      
      // If unread count increased, show toast
      if (messageUnreadCount > previousMessageCountRef.current && previousMessageCountRef.current > 0) {
        const newCount = messageUnreadCount - previousMessageCountRef.current;
        setNewMessageCount(newCount);
        setShowToast(true);
      }
      
      previousMessageCountRef.current = messageUnreadCount;
      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    // Initial load
    loadMessages();

    // Set up polling interval - check every 10 seconds
    pollIntervalRef.current = setInterval(loadMessages, 10000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isEnabled, loadMessages]);

  const closeToast = useCallback(() => {
    setShowToast(false);
    setNewMessageCount(0);
  }, []);

  return {
    showToast,
    newMessageCount,
    unreadCount,
    closeToast
  };
};
