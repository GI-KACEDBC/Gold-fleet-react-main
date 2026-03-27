import React from 'react';

/**
 * QUICK START USAGE EXAMPLE
 * 
 * Copy this exact code to quickly test the messaging UI
 */

// 1. In your page component:

import { MessageLayout } from './components/Messaging';

const MyMessagingPage = () => {
  // Your state management here
  
  return (
    <MessageLayout
      conversations={conversations}
      messages={messages}
      currentUserId={userId}
      selectedConversationId={selectedId}
      onSelectConversation={handleSelectConversation}
      onSendMessage={handleSendMessage}
      onSearch={handleSearch}
      isLoading={loading}
      error={error}
    />
  );
};

// 2. Or for quick testing, use the demo component:

import { MessagingDemo } from './components/Messaging';

export default function QuickTest() {
  return <MessagingDemo />;
}

// ============================================================================
// STYLING CUSTOMIZATION QUICK REFERENCE
// ============================================================================

/**
 * COLORS
 * 
 * Primary (Received Messages, Highlights):
 * - bg-blue-500:  #3B82F6
 * - bg-blue-600:  #2563EB (hover)
 * 
 * Secondary (Gradient, Active States):
 * - bg-purple-600: #9333EA
 * 
 * Backgrounds:
 * - bg-white:     #FFFFFF (main background)
 * - bg-gray-50:   #F9FAFB (input background, hover states)
 * - bg-gray-100:  #F3F4F6 (sent message background)
 * 
 * Borders:
 * - border-gray-200: #E5E7EB (subtle separators)
 * - border-gray-100: #F3F4F6 (very subtle)
 * 
 * Text:
 * - text-gray-900: #111827 (primary text)
 * - text-gray-500: #6B7280 (secondary text)
 * - text-gray-400: #9CA3AF (muted text)
 * 
 * Status:
 * - bg-green-500:  #22C55E (online indicator)
 */

/**
 * TO CHANGE COLOR SCHEME:
 * 
 * 1. Find all instances of 'blue-500' or 'blue-600'
 * 2. Replace with your desired color (e.g., 'indigo-500')
 * 3. Update associated hover/active states
 * 
 * Example - Change from Blue to Indigo:
 *   bg-blue-500 → bg-indigo-500
 *   bg-blue-600 → bg-indigo-600
 *   border-blue-500 → border-indigo-500
 *   hover:bg-blue-600 → hover:bg-indigo-600
 *   focus:border-blue-500 → focus:border-indigo-500
 */

/**
 * KEY SPACING VALUES
 * 
 * Padding:
 * - px-2, px-3, px-4, px-6   (horizontal)
 * - py-2, py-3, py-4         (vertical)
 * 
 * Gaps:
 * - gap-1, gap-2, gap-3      (between elements)
 * 
 * Margins:
 * - mt-1, mt-2, mb-2, mb-3   (margins)
 */

/**
 * KEY BORDER RADIUS VALUES
 * 
 * - rounded-full    (50% - circles)
 * - rounded-2xl     (1rem - message bubbles)
 * - rounded-lg      (0.5rem - buttons)
 * - rounded-xl      (0.75rem - cards)
 */

/**
 * SHADOW VALUES
 * 
 * - shadow-sm       (subtle - message bubbles)
 * - shadow-md       (medium - modal cards)
 * - shadow-lg       (large - headers)
 */

// ============================================================================
// COMPONENT CUSTOMIZATION EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Change Primary Color from Blue to Purple
 */

// In MessageInput.jsx, change:
// FROM: bg-blue-500 text-white hover:bg-blue-600
// TO:   bg-purple-500 text-white hover:bg-purple-600

/**
 * EXAMPLE 2: Add Custom Avatar Component
 */

// In ConversationItem.jsx, replace avatar rendering:
/*
// FROM:
{participantAvatar ? (
  <img src={participantAvatar} alt={participantName} className="w-12 h-12 rounded-full object-cover" />
) : (
  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
    {participantName.charAt(0).toUpperCase()}
  </div>
)}

// TO: (use your custom Avatar component)
<Avatar name={participantName} src={participantAvatar} size="md" />
*/

/**
 * EXAMPLE 3: Add Message Reactions
 */

// In MessageBubble.jsx, add after message content:
/*
<div className="flex gap-1 mt-2">
  <button className="text-lg hover:scale-125 transition-transform" title="Like">👍</button>
  <button className="text-lg hover:scale-125 transition-transform" title="Love">❤️</button>
  <button className="text-lg hover:scale-125 transition-transform" title="Laugh">😂</button>
  <button className="text-lg hover:scale-125 transition-transform" title="More">+</button>
</div>
*/

/**
 * EXAMPLE 4: Add Message Status Indicator
 */

// In MessageBubble.jsx, add after timestamp:
/*
{isSent && (
  <div className="flex gap-1 text-xs text-gray-400 mt-1">
    {message.status === 'sent' && <span>✓</span>}
    {message.status === 'delivered' && <span>✓✓</span>}
    {message.status === 'read' && <span className="text-blue-500">✓✓</span>}
  </div>
)}
*/

/**
 * EXAMPLE 5: Add Typing Indicator
 */

// In ChatWindow.jsx, add before messagesEndRef:
/*
{isTyping && (
  <div className="flex items-end gap-2">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
      T
    </div>
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl rounded-tl-md px-4 py-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
      </div>
    </div>
  </div>
)}
*/

/**
 * EXAMPLE 6: Add Unread Badge to Conversation List
 */

// In ConversationList.jsx, add to header:
/*
const unreadTotal = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
{unreadTotal > 0 && (
  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
    {unreadTotal}
  </span>
)}
*/

// ============================================================================
// RESPONSIVE MEDIA QUERIES
// ============================================================================

/*
Tailwind Breakpoints:
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

Usage Examples:
- Hidden on mobile, shown on desktop: hidden md:block
- Different width on tablet: w-full md:w-2/3 lg:w-1/2
- Different layout on mobile: flex-col md:flex-row
*/

// For mobile-responsive message layout:
/*
<div className="flex flex-col md:flex-row h-screen">
  <div className="w-full md:w-[30%] border-r border-gray-200">
    {/* Sidebar - hidden on mobile when chat is open *\/}
  </div>
  <div className="flex-1">
    {/* Chat - full width on mobile *\/}
  </div>
</div>
*/

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * 1. Memoize ConversationItem to prevent unnecessary re-renders
 */

// In ConversationItem.jsx:
export default React.memo(ConversationItem, (prev, next) => {
  return (
    prev.conversation.id === next.conversation.id &&
    prev.isSelected === next.isSelected &&
    prev.conversation.lastMessage === next.conversation.lastMessage
  );
});

/**
 * 2. Virtualize long message lists (1000+ messages)
 */

// Install: npm install react-window
// Then in ChatWindow.jsx:
/*
import { FixedSizeList as List } from 'react-window';

<List
  height={messageContainerHeight}
  itemCount={messages.length}
  itemSize={60}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} isSent={isSent} />
    </div>
  )}
</List>
*/

/**
 * 3. Debounce search input
 */

// In ConversationList.jsx:
/*
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useCallback(
  debounce((query) => onSearch(query), 300),
  [onSearch]
);

const handleSearchChange = (e) => {
  const query = e.target.value;
  setSearchQuery(query);
  debouncedSearch(query);
};
*/

// ============================================================================
// TESTING TIPS
// ============================================================================

/**
 * Test Different Data States:
 */

// 1. Empty conversations
conversations = []

// 2. Long conversation names
conversations = [{ participantName: 'A very long name that might wrap' }]

// 3. Many unread messages
conversations = [{ unreadCount: 999 }]

// 4. Very long messages
messages = [{ content: 'Lorem ipsum dolor sit amet...' }]

// 5. Messages from both users
messages = [
  { senderId: 'user-1', content: 'Sent by me' },
  { senderId: 'user-2', content: 'Sent by them' }
]

/**
 * Test Different Screens:
 */

// Browser DevTools > Toggle device toolbar
// Test: 375px (mobile), 768px (tablet), 1920px (desktop)

/**
 * Test Loading States:
 */

// Pass isLoading={true} to MessageLayout

/**
 * Test Error States:
 */

// Pass error="Something went wrong" to MessageLayout

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

/**
 * Issue: Messages not scrolling to bottom
 * Solution: Check useEffect in ChatWindow.jsx, ensure messagesEndRef is set
 */

/**
 * Issue: Avatar images not loading
 * Solution: Verify image URLs are absolute, check CORS settings in API
 */

/**
 * Issue: Sent button not responding
 * Solution: Check if onSendMessage callback is implemented and works
 */

/**
 * Issue: Search not filtering conversations
 * Solution: Ensure ConversationList is filtering based on searchQuery prop
 */

/**
 * Issue: Tailwind styles not applying
 * Solution: Check tailwind.config.js includes correct content paths
 */

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

/*
Before going live:

[ ] Test on real backend API
[ ] Test with actual user data
[ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
[ ] Test on mobile devices
[ ] Add error boundaries
[ ] Implement loading states
[ ] Add success/error notifications
[ ] Set up real-time updates (WebSocket)
[ ] Performance test with large message lists
[ ] Accessibility test (keyboard navigation, screen readers)
[ ] Add analytics/tracking
[ ] Update documentation
[ ] Create admin dashboard for message management
*/

export default function QuickReference() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Messaging UI - Quick Reference</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Component Files</h2>
        <ul className="space-y-2 font-mono text-sm">
          <li>✅ MessageLayout.jsx - Main container</li>
          <li>✅ ConversationList.jsx - Sidebar</li>
          <li>✅ ConversationItem.jsx - List item</li>
          <li>✅ ChatWindow.jsx - Chat area</li>
          <li>✅ ChatHeader.jsx - Header</li>
          <li>✅ MessageBubble.jsx - Message styling</li>
          <li>✅ MessageInput.jsx - Input area</li>
          <li>✅ MessagingDemo.jsx - Demo component</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Quick Import</h2>
        <pre className="bg-gray-100 p-4 rounded font-mono text-sm">
{`import { MessageLayout } from './components/Messaging';

<MessageLayout
  conversations={conversations}
  messages={messages}
  currentUserId={userId}
  selectedConversationId={selectedId}
  onSelectConversation={handleSelectConversation}
  onSendMessage={handleSendMessage}
  onSearch={handleSearch}
  isLoading={loading}
  error={error}
/>`}
        </pre>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Documentation Files</h2>
        <ul className="space-y-2 font-mono text-sm">
          <li>📄 MESSAGING_SETUP.md - Full setup guide</li>
          <li>📄 INTEGRATION_GUIDE.md - API integration examples</li>
          <li>📄 QUICK_REFERENCE.md - This file</li>
        </ul>
      </section>
    </div>
  );
}
