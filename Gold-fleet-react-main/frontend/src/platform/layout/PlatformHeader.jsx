import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaSearch, FaBell, FaUser, FaSignOutAlt, FaTimes, FaReply, FaEnvelope } from 'react-icons/fa';
import platformApi from '../services/platformApi';
import Toast from '../../components/Toast';
import { usePlatformMessageNotifications } from '../hooks/usePlatformMessageNotifications';

/**
 * Platform Header - Modern Gold & White Theme
 * Professional top navigation bar for Platform Owner
 * Color scheme: Gold (#FFD700) and White (#FFFFFF)
 */
export default function PlatformHeader({ sidebarOpen, setSidebarOpen, isLarge, sidebarWidth = 0 }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Message notifications
  const { showToast, newMessageCount, unreadCount: messageUnreadCount, closeToast } = usePlatformMessageNotifications(true);

  // Reply functionality state
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/notifications', {
        headers: platformApi.getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || data.data || []);
        setUnreadCount(data.unread_count || data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Detect if we're on a message page and load current message
  useEffect(() => {
    const path = window.location.pathname;
    const messageMatch = path.match(/^\/platform\/messages\/(\d+)$/);
    if (messageMatch) {
      const messageId = messageMatch[1];
      // Load the current message for reply functionality
      const loadCurrentMessage = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/messages/${messageId}`, {
            headers: platformApi.getAuthHeader(),
          });
          if (res.ok) {
            const message = await res.json();
            setCurrentMessage(message.data || message);
          }
        } catch (err) {
          console.error('Failed to load current message', err);
        }
      };
      loadCurrentMessage();
    } else {
      setCurrentMessage(null);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('platformToken');
    navigate('/platform/login', { replace: true });
  };

  const handleNotificationClick = async (notif) => {
    try {
      await fetch(`http://localhost:8000/api/notifications/${notif.id}/read`, {
        method: 'PATCH',
        headers: platformApi.getAuthHeader(),
      });
      setNotificationsOpen(false);
      await loadNotifications();

      const redirect = notif.data?.redirect_url || (notif.data?.message_id ? `/platform/messages/${notif.data.message_id}` : null);
      if (redirect) {
        navigate(redirect);
      } else {
        navigate('/platform/messages');
      }
    } catch (err) {
      console.error('Failed to handle notification click', err);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !currentMessage) return;

    setReplying(true);
    try {
      const res = await fetch(`http://localhost:8000/api/messages/${currentMessage.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...platformApi.getAuthHeader(),
        },
        body: JSON.stringify({
          message: replyText.trim(),
        }),
      });

      if (res.ok) {
        setReplyText('');
        setReplyOpen(false);
        setCurrentMessage(null);
        // Refresh notifications to show new message
        await loadNotifications();
        // Navigate to messages to see the reply
        navigate('/platform/messages');
      } else {
        console.error('Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setReplying(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Search:', searchQuery);
      setSearchQuery('');
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-gray-300 shadow-sm z-50 flex items-center px-3 lg:px-6"
      style={{
        paddingLeft: isLarge ? `calc(1rem + ${sidebarWidth}px)` : '0.75rem',
      }}
    >
      <div className="flex items-center justify-between w-full h-full gap-3">
        {/* Left Section - Logo & Toggle */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo - Desktop */}
          <div className="hidden md:flex items-center gap-1.5 font-bold">
            <img src="/icons/result.png" alt="Gold Fleet Logo" className="w-8 h-8 object-contain flex-shrink-0" />
            <span className="text-gray-800 hidden lg:inline text-sm whitespace-nowrap">Gold Fleet</span>
          </div>

          {/* Sidebar Toggle - Mobile */}
          {!isLarge && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              {sidebarOpen ? <FaTimes className="w-4 h-4" /> : <FaBars className="w-4 h-4" />}
            </button>
          )}

          {/* Search Bar - Responsive */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
            <div className="flex-1 min-w-0 relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-200 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
              >
                <FaSearch className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Section - Notifications & Profile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); closeToast(); }}
              className="relative text-gray-700 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <FaBell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-yellow-600 text-white text-xs font-bold rounded-full shadow-md text-[10px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-300 z-50 max-h-60 overflow-y-auto">
                <div className="px-4 py-3 border-b border-gray-300 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">{unreadCount}</span>
                </div>
                {notifLoading ? (
                  <div className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-xs">No notifications</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 p-1.5 rounded-full bg-gray-100">
                            <FaBell className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900">{n.title || n.message}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {n.message?.substring(0, 40)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <button
            onClick={() => {
              closeToast();
              navigate('/platform/messages');
            }}
            className="relative text-gray-700 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
            title="Messages"
          >
            <FaEnvelope className="w-4 h-4" />
            {messageUnreadCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-yellow-600 text-white text-xs font-bold rounded-full shadow-md text-[10px]">
                {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
              </span>
            )}
          </button>

          {/* Reply Button - Only show when viewing a message */}
          {currentMessage && (
            <button
              onClick={() => setReplyOpen(true)}
              className="text-gray-700 hover:text-gray-900 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
              title="Reply to message"
            >
              <FaReply className="w-4 h-4" />
            </button>
          )}

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors font-semibold"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold shadow-md text-xs flex-shrink-0">
                PO
              </div>
              <span className="text-xs font-semibold hidden sm:inline">Admin</span>
            </button>

            {/* Profile Menu */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50">
                <div className="px-3 py-2 border-b border-gray-300">
                  <p className="text-xs font-bold text-gray-900">Platform Owner</p>
                  <p className="text-xs text-gray-500">Admin Account</p>
                </div>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/platform/settings'); }}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-2 font-medium text-xs"
                >
                  <FaUser className="w-3 h-3" />
                  Settings
                </button>
                <hr className="border-gray-300 my-1" />
                <button
                  onClick={() => { setProfileOpen(false); handleLogout(); }}
                  className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-2 font-medium text-xs"
                >
                  <FaSignOutAlt className="w-3 h-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for dropdowns */}
      {(notificationsOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setNotificationsOpen(false); setProfileOpen(false); }}
        />
      )}

      {/* Toast Notification for New Messages */}
      <Toast 
        type="gold"
        count={newMessageCount}
        onClose={closeToast}
        duration={5000}
        show={showToast}
        positionX="left"
      />

      {/* Reply Modal */}
      {replyOpen && currentMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-300">
              <h3 className="text-lg font-bold text-gray-900">Reply to Message</h3>
              <p className="text-sm text-gray-600 mt-1">
                Replying to: <span className="font-medium">{currentMessage.subject || 'Message'}</span>
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {currentMessage.message || currentMessage.content}
                </p>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-200 resize-none"
                rows={4}
                disabled={replying}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-300 flex justify-end gap-3">
              <button
                onClick={() => { setReplyOpen(false); setReplyText(''); }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                disabled={replying}
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || replying}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {replying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  'Send Reply'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

