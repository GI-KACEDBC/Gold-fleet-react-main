# Driver Messaging & Support System

## Overview
Drivers can now send support messages directly to their company administration and the platform support team through the Messages page in their driver dashboard.

## How It Works

### For Drivers
1. Navigate to `/driver/messages` in the driver portal
2. Compose a new message with:
   - **Subject** - Brief description of the issue (e.g., "Vehicle Maintenance", "Trip Issue", "Account Help")
   - **Message** - Detailed description of the problem or question
3. Click **Send Message**
4. The system will:
   - Send the message to your company admin
   - Notify the platform support team
   - Track the message status (Pending → Read/Replied)

### Message Statuses
- **Pending**: Message sent, awaiting response from company admin
- **Read**: Company admin has read your message
- **Replied**: Company admin or support team has responded

### For Company Admin
When a driver sends a message:
1. **Notification**: Company admin receives an in-app notification
2. **Message List**: Message appears in their messaging dashboard
3. **Response**: Admin can reply to driver messages directly
4. **Management**: Messages can be marked as read, replied, or managed

## Backend Implementation

### API Endpoints
All endpoints are at `/api/messages` and require authentication (Bearer token)

#### Get All Messages
```bash
GET /api/messages
```
Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "subject": "Support Request",
      "message": "I have an issue with...",
      "from_type": "driver",
      "from_user_id": 5,
      "status": "sent",
      "read": false,
      "created_at": "2024-03-24T10:30:00Z"
    }
  ],
  "unread_count": 3
}
```

#### Send Message
```bash
POST /api/messages
Content-Type: application/json

{
  "subject": "Vehicle Maintenance Issue",
  "message": "The vehicle VEH-001 needs immediate maintenance",
  "to_user_id": null  // Optional: specific company admin ID
}
```

Response:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": 5,
    "subject": "Vehicle Maintenance Issue",
    "message": "The vehicle VEH-001 needs immediate maintenance",
    "status": "sent",
    "read": false,
    "created_at": "2024-03-24T10:35:00Z"
  }
}
```

#### Get Specific Message
```bash
GET /api/messages/{id}
```

#### Reply to Message
```bash
POST /api/messages/{id}/reply
Content-Type: application/json

{
  "message": "Thank you for reaching out, we are working on this..."
}
```

#### Mark Message as Read
```bash
PATCH /api/messages/{id}/read
```

#### Delete Message
```bash
DELETE /api/messages/{id}
```

## Frontend Components

### DriverMessaging Component
**Location**: `frontend/src/pages/DriverMessaging.jsx`

**Features**:
- Load message history on component mount
- Compose and send new messages
- Display message status with icons
- Format timestamps (Today, Yesterday, date)
- Show unread message count
- Provide success/error feedback
- Character count for message composition

**API Integration**:
```typescript
// Fetch messages
const response = await api.getMessages();

// Send message
const response = await api.sendMessage({
  subject: subjectText,
  message: messageText,
});
```

## UI/UX Features

### Message Display
- Each message shows:
  - **Subject** - The title of the message
  - **Content** - Full message text
  - **Status Badge** - Visual indicator (Read/Pending)
  - **Timestamp** - When message was created
  - **Read Indicator** - Checkmark icon for read messages

### Compose Form
- **Subject Input** - Text field with suggestion "Support Request"
- **Message Textarea** - Full-featured message editor
- **Character Counter** - Shows current char count / 5000 max
- **Send Button** - Disabled when message is empty
- **Clear Button** - Reset form to defaults
- **Info Box** - Explains message goes to company admin

### States
- **Loading**: Show spinner while fetching messages
- **Empty**: Show friendly message if no messages yet
- **Error**: Display error messages with dismiss option
- **Success**: Show confirmation when message sent
- **Sending**: Button shows loading state while sending

## Testing

### Test Sending a Message
```bash
curl -X POST http://localhost:8000/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Support Request",
    "message": "This is a test message from a driver"
  }'
```

### Test Getting Messages
```bash
curl -X GET http://localhost:8000/api/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Message Not Sending
1. Check if authentication token is valid
2. Verify user has company_id assigned
3. Check browser console for error messages
4. Ensure backend server is running on port 8000

### Messages Not Loading
1. Check network tab in browser DevTools
2. Verify API endpoint response status
3. Check for CORS errors
4. Clear browser cache and reload

### No Notification Received
1. Check notification settings
2. Verify company admin has notifications enabled
3. Check notification model configuration

## Database Schema

### messages table
```sql
CREATE TABLE messages (
  id BIGINT PRIMARY KEY,
  company_id BIGINT NOT NULL,
  from_user_id BIGINT NOT NULL,
  to_user_id BIGINT NULLABLE,
  from_type VARCHAR (50) DEFAULT 'company', -- 'driver', 'company', 'platform'
  to_type VARCHAR (50) DEFAULT 'platform',
  subject VARCHAR (255) NOT NULL,
  message LONGTEXT NOT NULL,
  body LONGTEXT,
  read BOOLEAN DEFAULT FALSE,
  status VARCHAR (50) DEFAULT 'sent',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE INDEX messages_company_id ON messages(company_id);
CREATE INDEX messages_from_user_id ON messages(from_user_id);
CREATE INDEX messages_to_user_id ON messages(to_user_id);
CREATE INDEX messages_read ON messages(read);
```

## Future Enhancements

1. **Real-time Messaging** - WebSocket integration for live chat
2. **Attachments** - Allow drivers to attach photos/documents
3. **Message Categories** - Organize by type (Maintenance, Trips, Account, etc.)
4. **Search & Filter** - Search messages by keyword or date
5. **Conversations** - Group related messages into conversations
6. **Rating System** - Rate response quality from admins
7. **FAQ/Knowledge Base** - Common issues and solutions
8. **Automated Responses** - Quick reply templates

## Security Considerations

1. **Authentication**: All endpoints require valid Bearer token
2. **Authorization**: Users can only see messages related to their company
3. **Rate Limiting**: Prevent message flooding (implement if needed)
4. **Input Validation**: Subject and message validated server-side
5. **Data Encryption**: Messages stored securely in database
6. **CORS**: Properly configured to prevent unauthorized access

## Related Documentation
- [MESSAGING_SYSTEM_IMPLEMENTATION.md](./MESSAGING_SYSTEM_IMPLEMENTATION.md) - Full messaging system
- [BIDIRECTIONAL_MESSAGING_COMPLETE.md](./BIDIRECTIONAL_MESSAGING_COMPLETE.md) - Company-platform messaging
- [DRIVER_LOGIN_SEEDER.md](./DRIVER_LOGIN_SEEDER.md) - Testing driver accounts
