# LinkedIn-Style Messaging UI - Component Documentation

## Overview
A modern, reusable messaging UI component system built with React, Tailwind CSS, and functional components. Designed for easy integration with existing backend APIs.

## Component Structure

### 1. **MessageLayout** (Main Container)
The root component that manages the overall layout (30% sidebar + 70% chat area).

**Props:**
```javascript
{
  conversations: Array,           // List of conversations
  messages: Array,                // Messages for selected conversation
  currentUserId: String,          // ID of current user
  selectedConversationId: String, // ID of selected conversation
  onSelectConversation: Function, // Callback when selecting a conversation
  onSendMessage: Function,        // Callback when sending a message
  onSearch: Function,             // Callback for search queries
  isLoading: Boolean,             // Loading state
  error: String                   // Error message
}
```

**Usage:**
```jsx
import { MessageLayout } from './components/Messaging';

<MessageLayout
  conversations={conversations}
  messages={messages}
  currentUserId={user.id}
  selectedConversationId={selectedId}
  onSelectConversation={handleSelectConversation}
  onSendMessage={handleSendMessage}
  onSearch={handleSearch}
  isLoading={loading}
  error={error}
/>
```

---

### 2. **ConversationList** (Sidebar)
Scrollable list of conversations with search functionality.

**Props:**
```javascript
{
  conversations: Array,
  selectedConversationId: String,
  onSelectConversation: Function,
  onSearch: Function,
  isLoading: Boolean,
  searchQuery: String
}
```

---

### 3. **ConversationItem** (List Item)
Individual conversation item showing avatar, name, last message, and timestamp.

**Props:**
```javascript
{
  conversation: {
    id: String,
    participantName: String,
    participantAvatar: String | null,
    lastMessage: String,
    timestamp: Date,
    unreadCount: Number
  },
  isSelected: Boolean,
  onSelect: Function
}
```

---

### 4. **ChatWindow** (Main Chat Area)
Displays header, messages, and input area.

**Props:**
```javascript
{
  conversation: Object,
  messages: Array,
  currentUserId: String,
  onSendMessage: Function,
  isLoading: Boolean,
  error: String
}
```

---

### 5. **ChatHeader** (Chat Area Header)
Shows participant info and action buttons.

**Props:**
```javascript
{
  conversation: {
    participantName: String,
    participantAvatar: String | null,
    participantRole: String,
    isOnline: Boolean
  }
}
```

---

### 6. **MessageBubble** (Message)
Individual message with styling for sent/received.

**Props:**
```javascript
{
  message: {
    id: String,
    content: String,
    timestamp: Date,
    senderName: String,
    senderAvatar: String | null
  },
  isSent: Boolean
}
```

---

### 7. **MessageInput** (Input Area)
Text input with emoji, attachment, GIF buttons, and send button.

**Props:**
```javascript
{
  onSendMessage: Function(messageText)
}
```

---

## Data Models

### Conversation Object
```javascript
{
  id: String,                    // Unique identifier
  participantId: String,         // ID of other party
  participantName: String,       // Display name
  participantAvatar: String|null,// Avatar image URL
  participantRole: String,       // User role/title
  isOnline: Boolean,             // Online status
  lastMessage: String,           // Last message preview
  timestamp: Date,               // Last message time
  unreadCount: Number            // Unread message count
}
```

### Message Object
```javascript
{
  id: String,                    // Unique identifier
  conversationId: String,        // Related conversation
  senderId: String,              // Message sender ID
  senderName: String,            // Sender display name
  senderAvatar: String|null,     // Sender avatar URL
  content: String,               // Message text
  timestamp: Date                // When sent
}
```

---

## API Integration Guide

### Step 1: Replace Mock Data with API Calls
**In your messaging page, replace demo conversationsState with API calls:**

```jsx
import { useState, useEffect } from 'react';
import { api } from '../services/api'; // Your API service
import { MessageLayout } from '../components/Messaging';

export default function MessagingPage() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const data = await api.getConversations();
        setConversations(data);
        if (data.length > 0) {
          setSelectedConvId(data[0].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;

    const loadMessages = async () => {
      try {
        const data = await api.getConversationMessages(selectedConvId);
        setMessages(data);
      } catch (err) {
        setError(err.message);
      }
    };

    loadMessages();
  }, [selectedConvId]);

  // Handle sending messages
  const handleSendMessage = async (messageText) => {
    try {
      const newMessage = await api.sendMessage(selectedConvId, {
        content: messageText
      });
      
      // Add new message to local state
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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <MessageLayout
      conversations={conversations}
      messages={messages}
      currentUserId={getCurrentUserId()} // Your method to get current user
      selectedConversationId={selectedConvId}
      onSelectConversation={setSelectedConvId}
      onSendMessage={handleSendMessage}
      isLoading={loading}
      error={error}
    />
  );
}
```

### Step 2: API Endpoints Needed
Your API should provide these endpoints:

```javascript
// Get all conversations for current user
GET /api/conversations
Response: Array<Conversation>

// Get all messages for a conversation
GET /api/conversations/:conversationId/messages
Response: Array<Message>

// Send a new message
POST /api/conversations/:conversationId/messages
Body: { content: String }
Response: Message

// Mark conversation as read (optional)
PUT /api/conversations/:conversationId/read
Response: Conversation

// Search conversations (optional)
GET /api/conversations/search?q=query
Response: Array<Conversation>
```

### Step 3: Real-Time Updates (Optional)
For real-time messaging, integrate with WebSockets or Socket.io:

```jsx
useEffect(() => {
  const socket = io('your-api-url');

  // Listen for new messages
  socket.on('message:new', (message) => {
    setMessages((prev) => [...prev, message]);
  });

  // Listen for conversation updates
  socket.on('conversation:updated', (conversation) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversation.id ? conversation : c))
    );
  });

  return () => socket.disconnect();
}, []);
```

---

## Styling & Customization

### Colors
- **Primary:** Blue (#3B82F6) - Used for received messages & buttons
- **Accent:** Purple (#9333EA) - Used in gradient bubbles
- **Gray:** Gray-50 to Gray-900 - For backgrounds and text
- **Online Status:** Green (#22C55E)

### Tailwind Classes Used
- `rounded-full` - Circular avatars & input bars
- `rounded-2xl` - Large rounded corners for bubbles
- `shadow-sm` - Subtle shadows on message bubbles
- `transition-all` - Smooth interactions
- `hover:bg-gray-50` - Hover effects on conversations

### Customizing Colors
Update Tailwind classes in each component:
```jsx
// Change primary color from blue to purple
bg-blue-500 → bg-purple-500
border-blue-500 → border-purple-500
hover:bg-blue-600 → hover:bg-purple-600
```

---

## Responsive Design

### Desktop (default)
- 30% left sidebar (300px min)
- 70% right chat area
- Full height layout

### Tablet (optional - add to MessageLayout)
```jsx
// Replace fixed width with responsive
<div className="w-[30%] md:w-[35%] lg:w-[30%]">
```

### Mobile (optional - add to MessageLayout)
```jsx
// Add mobile layout where sidebar is toggled
<div className={`${showSidebar ? 'w-full' : 'hidden'} md:w-[30%]`}>
```

---

## Key Features

✅ **LinkedIn-style chat layout** - Split view with conversations & messages
✅ **Message grouping by date** - "Today", "Yesterday", etc.
✅ **Responsive design** - Desktop-first with Tailwind
✅ **Unread indicators** - Badge showing unread message count
✅ **Online status** - Green dot indicator
✅ **Search conversations** - Filter by name or message content
✅ **Message timestamps** - Smart formatting (now, 5m, 2h, etc.)
✅ **Action buttons** - Star, menu, emoji, attachment, GIF
✅ **Loading states** - Spinner during fetch/send
✅ **Error handling** - Display error messages
✅ **Auto-scroll** - Scroll to latest message on new message
✅ **Reusable components** - Clean separation of concerns

---

## Integration Checklist

- [ ] Copy all components to `frontend/src/components/Messaging/`
- [ ] Import `MessageLayout` in your messaging page
- [ ] Replace mock data with API calls
- [ ] Ensure your API provides required endpoints
- [ ] Test with real backend data
- [ ] Add real-time updates (Socket.io) if needed
- [ ] Customize colors to match your brand
- [ ] Add responsive design for mobile (optional)
- [ ] Test on different screen sizes
- [ ] Add error boundary if needed

---

## File Structure
```
frontend/src/components/Messaging/
├── index.js                 (Exports)
├── MessageLayout.jsx        (Main container)
├── ConversationList.jsx     (Sidebar)
├── ConversationItem.jsx     (List item)
├── ChatWindow.jsx           (Chat area)
├── ChatHeader.jsx           (Chat header)
├── MessageBubble.jsx        (Message styling)
├── MessageInput.jsx         (Input area)
└── MessagingDemo.jsx        (Example implementation)
```

---

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies
- React 16.8+ (hooks)
- Tailwind CSS 3.0+
- No external chat libraries

---

## Performance Tips

1. **Virtualize long message lists** - Use `react-window` for 1000+ messages
2. **Debounce search** - Add debounce to `onSearch` callback
3. **Lazy load avatars** - Use `<img loading="lazy">` for profiles
4. **Optimize re-renders** - Use `React.memo()` for ConversationItem
5. **Paginate messages** - Load 50 messages at a time, not all

---

## Troubleshooting

**Messages not appearing?**
- Check if `messages` prop is being passed correctly
- Verify data structure matches Message object schema
- Check browser console for errors

**Avatar not showing?**
- Ensure `participantAvatar` is a valid image URL
- Component falls back to initial letter avatar

**Search not working?**
- Check if `onSearch` callback is implemented
- Verify filter logic in ConversationList

**Styling issues?**
- Ensure Tailwind CSS is properly configured
- Check if `tailwind.config.js` includes component paths

---

## Future Enhancements

- Message reactions (emoji reactions)
- File sharing with previews
- Message reactions/replies
- Typing indicators
- Forwarding messages
- Message pinning
- Group conversations
- Voice/video call integration
- Message persistence/syncing
