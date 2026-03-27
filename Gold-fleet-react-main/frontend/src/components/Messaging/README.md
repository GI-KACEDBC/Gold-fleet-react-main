# LinkedIn-Style Messaging UI Components

A modern, production-ready messaging interface built with React, Tailwind CSS, and functional components. Designed specifically for clean integration with your existing backend API.

## ✨ Features

- **Split Layout**: 30% conversation sidebar + 70% chat area
- **LinkedIn-style Design**: Modern SaaS dashboard feel with soft shadows and rounded corners
- **Message Grouping**: Messages organized by date (Today, Yesterday, etc.)
- **Two Message Styles**: 
  - Sent messages (right-aligned, light gray)
  - Received messages (left-aligned, blue/purple gradient)
- **Conversation List**: 
  - Search functionality
  - Last message preview with truncation
  - Unread badge indicators
  - Online status indicators
  - Smart timestamps (now, 5m, 2h, etc.)
- **Chat Header**: Shows participant info, online status, action buttons
- **Rich Input Area**: Text input + emoji, attachment, GIF buttons
- **Auto-scroll**: Automatically scrolls to latest message
- **Loading & Error States**: Built-in feedback for async operations
- **Responsive Design**: Desktop-first with optional mobile support
- **Clean Architecture**: Reusable, composable components
- **Zero Backend Assumptions**: Handles data with props, easy API integration

## 📁 Directory Structure

```
frontend/src/components/Messaging/
├── MessageLayout.jsx           Main container (30%/70% split)
├── ConversationList.jsx        Left sidebar with search
├── ConversationItem.jsx        Individual conversation item
├── ChatWindow.jsx              Chat display area
├── ChatHeader.jsx              Chat header with user info
├── MessageBubble.jsx           Message styling (sent/received)
├── MessageInput.jsx            Input field with action buttons
├── MessagingDemo.jsx           Example implementation with mock data
├── index.js                    Barrel export
├── MESSAGING_SETUP.md          Comprehensive setup guide
├── INTEGRATION_GUIDE.md        API integration examples
└── QUICK_REFERENCE.md          Quick tips & customization
```

## 🚀 Quick Start

### 1. Import the Component

```jsx
import { MessageLayout } from './components/Messaging';
```

### 2. Use in Your Page

```jsx
export default function MessagingPage() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);

  return (
    <MessageLayout
      conversations={conversations}
      messages={messages}
      currentUserId={userId}
      selectedConversationId={selectedConvId}
      onSelectConversation={setSelectedConvId}
      onSendMessage={handleSendMessage}
      onSearch={handleSearch}
      isLoading={loading}
      error={error}
    />
  );
}
```

### 3. Test with Demo Component

```jsx
import { MessagingDemo } from './components/Messaging';

// This shows the component with mock data
<MessagingDemo />
```

## 📊 Data Structure

### Conversation Object
```javascript
{
  id: string,                  // Unique ID
  participantId: string,       // Other party's ID
  participantName: string,     // Display name
  participantAvatar: string|null, // Avatar URL
  participantRole: string,     // User role/title
  isOnline: boolean,          // Online status
  lastMessage: string,        // Last message text
  timestamp: Date,            // Last message time
  unreadCount: number         // Unread count
}
```

### Message Object
```javascript
{
  id: string,                 // Unique ID
  conversationId: string,     // Related conversation
  senderId: string,          // Sender's ID
  senderName: string,        // Sender's name
  senderAvatar: string|null, // Sender's avatar
  content: string,           // Message text
  timestamp: Date            // When sent
}
```

## 🔌 API Integration

The components are designed to work with any backend. Here's the typical setup:

### API Endpoints Needed

```
GET    /api/conversations                    - Get all conversations
GET    /api/conversations/:id/messages       - Get messages for conversation
POST   /api/conversations/:id/messages       - Send a message
PUT    /api/conversations/:id/read           - Mark as read (optional)
GET    /api/conversations/search?q=query     - Search (optional)
```

### Example Integration

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for complete examples including:
- Company-side messaging page
- Platform/admin messaging page
- Real-time updates with WebSocket
- API service extensions

## 🎨 Customization

### Change Primary Color

Replace all instances of `blue-500`/`blue-600` with your color:

```jsx
// Example: Change to purple
bg-blue-500 → bg-purple-500
bg-blue-600 → bg-purple-600
border-blue-500 → border-purple-500
```

### Add Custom Components

Replace avatar rendering with your custom Avatar component:

```jsx
<Avatar name={participantName} src={participantAvatar} size="md" />
```

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for more customization examples.

## 📱 Responsive Design

**Desktop (default)**: 30% sidebar + 70% chat area

**Optional Mobile Support**: Sidebar collapses/toggles on small screens

```jsx
<div className="flex h-screen">
  <div className="w-[30%] md:hidden lg:block">
    {/* Sidebar hidden on mobile/tablet */}
  </div>
  <div className="flex-1">
    {/* Chat takes full width on mobile */}
  </div>
</div>
```

## 🧪 Testing

### With Mock Data
```jsx
import { MessagingDemo } from './components/Messaging';
<MessagingDemo />
```

### With Real API
Connect to your backend and pass real data via props. See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md).

## 📚 Complete Documentation

- **[MESSAGING_SETUP.md](./MESSAGING_SETUP.md)** - Full component guide with prop definitions, data models, API requirements, customization, and troubleshooting
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Step-by-step integration with company and platform examples, plus API service extensions
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick tips, code examples, customization shortcuts, and performance optimization

## ✅ Component Props Reference

### MessageLayout
```jsx
<MessageLayout
  conversations={Array}              // List of conversations
  messages={Array}                   // Messages for selected conversation
  currentUserId={String}             // Current user ID
  selectedConversationId={String}    // Currently selected conversation
  onSelectConversation={Function}    // (convId) => void
  onSendMessage={Function}           // (messageText) => void | Promise
  onSearch={Function}                // (query) => void
  isLoading={Boolean}                // Show loading state
  error={String}                     // Error message to display
/>
```

## 🎯 Key Design Decisions

1. **Props-Based**: All data flows through props, no hardcoded API calls
2. **Callback Pattern**: Leaves implementation to parent component
3. **Data Agnostic**: Works with any data structure via mapping
4. **No External Libraries**: Only React, Tailwind CSS (no chat libraries)
5. **Minimal Dependencies**: Built entirely with Tailwind CSS utilities
6. **Accessibility**: Semantic HTML, ARIA labels where needed
7. **Performance**: Efficient re-renders, auto-scroll management

## 🔧 Technologies

- React 16.8+ (functional components & hooks)
- Tailwind CSS 3.0+
- No external chat libraries
- Pure JavaScript/JSX

## 📦 Installation

The components are already in your project at:
```
frontend/src/components/Messaging/
```

Just import and use!

```jsx
import { MessageLayout } from './components/Messaging';
```

## 🚦 Integration Checklist

- [ ] Review component files in `frontend/src/components/Messaging/`
- [ ] Read [MESSAGING_SETUP.md](./MESSAGING_SETUP.md) for architecture
- [ ] Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for API setup
- [ ] Test with MessagingDemo component
- [ ] Replace mock data with real API calls
- [ ] Implement required API endpoints
- [ ] Add error handling
- [ ] Test on multiple screens
- [ ] Customize colors/styling as needed
- [ ] Add real-time updates (optional)

## 💡 Usage Examples

### Company Messaging Page
```jsx
import { MessageLayout } from '../components/Messaging';
import { api } from '../services/api';

export default function CompanyMessagingPage() {
  // Fetch conversations
  const conversations = await api.get('/api/company/conversations');
  
  // Handle message send
  const handleSendMessage = async (text) => {
    await api.post(`/api/company/conversations/${selectedId}/messages`, {
      content: text
    });
  };

  return (
    <MessageLayout
      conversations={conversations}
      messages={messages}
      currentUserId={userId}
      selectedConversationId={selectedId}
      onSelectConversation={setSelectedId}
      onSendMessage={handleSendMessage}
      onSearch={handleSearch}
    />
  );
}
```

### Platform Admin Messaging
```jsx
import { MessageLayout } from '../components/Messaging';

export default function AdminMessagingPage() {
  // Fetch all conversations (admin only)
  const conversations = await api.get('/api/admin/conversations');
  
  // Handle admin message reply
  const handleSendMessage = async (text) => {
    await api.post(
      `/api/admin/conversations/${selectedId}/messages`,
      { content: text }
    );
  };

  return (
    <MessageLayout
      conversations={conversations}
      messages={messages}
      currentUserId={adminId}
      selectedConversationId={selectedId}
      onSelectConversation={setSelectedId}
      onSendMessage={handleSendMessage}
      onSearch={handleSearch}
    />
  );
}
```

## 🆘 Troubleshooting

**Messages not appearing?**
- Check data structure matches Message schema
- Verify `messages` prop is being passed
- Check browser console for errors

**Avatar not showing?**
- Ensure `participantAvatar` is valid image URL
- Component falls back to initial letter avatar

**Styling looks wrong?**
- Verify Tailwind CSS is properly configured
- Check `tailwind.config.js` includes component paths

See [MESSAGING_SETUP.md](./MESSAGING_SETUP.md#troubleshooting) for more solutions.

## 📈 Performance Tips

1. **Virtualize long lists** - Use `react-window` for 1000+ messages
2. **Debounce search** - Add debounce to `onSearch` callback
3. **Lazy load avatars** - Use `loading="lazy"` on image tags
4. **Memoize components** - Use `React.memo()` for ConversationItem
5. **Paginate messages** - Load 50 at a time, not all

## 🎓 Learning Resources

- Review individual component files for detailed comments
- Check MessagingDemo.jsx for usage patterns
- See INTEGRATION_GUIDE.md for real-world examples
- Use QUICK_REFERENCE.md for common tasks

## 📝 Notes

- Components assume messaging backend already exists
- No database models, API routes, or backend logic included
- Focus on frontend UI and data presentation
- Easy to extend with additional features
- Follows modern React best practices

## 🎉 Ready to Use!

All components are production-ready and can be integrated immediately. Start with `MessagingDemo.jsx` to see how everything works together, then follow the integration guide for your specific use case.

---

**Questions?** Check the documentation files or review the inline code comments in each component.

**Next Steps:**
1. Import `MessageLayout` in your page
2. Connect to your API endpoints
3. Pass real data as props
4. Test end-to-end
5. Customize styling as needed

Happy messaging! 🚀
