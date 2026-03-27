# Bidirectional Messaging System - Quick Start Guide

## What's New?

You now have a complete messaging system that enables:
- **Platform → Company**: Send important messages to registered companies
- **Company → Platform**: Companies can reach out to platform support with questions/issues

## Setup Instructions

### 1. Update Database

Run the migration to add necessary fields to the messages table:

```bash
cd backend/
php artisan migrate
```

This will add:
- `company_id` - Link messages to companies
- `from_user_id`, `to_user_id` - Track senders and recipients
- `from_type`, `to_type` - Distinguish between platform and company messages
- `read`, `read_at` - Track read status
- Additional fields for better message management

### 2. Verify Files Are in Place

Check that these files exist:

**Backend:**
```
backend/app/Models/Message.php
backend/app/Http/Controllers/MessageController.php
backend/app/Http/Controllers/Api/PlatformMessageController.php
backend/routes/api.php (has message routes)
backend/database/migrations/2024_03_11_upgrade_messages_table.php
```

**Frontend:**
```
frontend/src/platform/services/platformApi.js (has message methods)
frontend/src/platform/pages/PlatformMessages.jsx (enhanced)
frontend/src/pages/MessagingPage.jsx (company messaging)
```

### 3. No Changes to Routes Needed

Routes are already configured in `backend/routes/api.php`. The system uses:
- `/api/messages` - Company user messaging
- `/api/platform/messages` - Platform admin messaging

## Using the System

### For Platform Admin

#### Accessing Messages
1. Login to platform admin
2. Click "Messages" in the sidebar
3. You'll see messages from all registered companies

#### Sending a Message to a Company

```
Step 1: Click "Compose" button
Step 2: Start typing company name - real-time search appears
Step 3: Select company from dropdown
Step 4: (Optional) Select specific admin or send to all admins
Step 5: Enter subject line
Step 6: Type your message
Step 7: Click "Send Message"
```

**Example:**
```
From: Platform Admin
To: ABC Logistics (All Admins)
Subject: Account Verification Required
Message: Please verify your email address to complete account setup.
```

#### Viewing Company Messages

1. Messages appear in the list with:
   - Company name
   - Subject line
   - Preview of message
   - Unread indicator
   - Timestamp

2. Click any message to:
   - View full content
   - Reply directly
   - Track conversation history

3. Messages are automatically marked as read when viewed

### For Company Users

#### Accessing Messages
1. Login to company account
2. Navigate to "Messages" in sidebar/dashboard
3. You'll see all communications with platform

#### Sending a Message to Platform

```
Step 1: Click "Compose" button
Step 2: Enter subject (e.g., "Subscription Question")
Step 3: Type your message
Step 4: Click "Send Message"
```

**Example:**
```
Subject: We'd Like to Upgrade Plan
Message: Hi, we've found your platform works great for our company.
We'd like to discuss upgrading to a higher tier plan.
Can someone help us with this?
```

#### Replying to Platform Messages

1. Click on incoming message from platform
2. Scroll to "Reply" section
3. Type your response
4. Click "Send Reply"

## Key Features

### Real-Time Company Search (Platform Side)
- As you type, matching companies appear
- Shows company name and email
- Only approved companies shown
- Instant admin list loading

### Automatic Notifications
- Sender gets notification when message is sent
- Recipient gets notification when message arrives
- Read status is tracked
- Unread count displayed in header

### Message Threading
- Related replies are grouped together
- Full conversation history visible
- Reply counts shown
- Context preserved

### Search & Organization
- Search by company name
- Search by subject
- Search by message content
- Pagination for large message lists
- Filter by read/unread status

## API Examples

### Send Message (Platform to Company)

```javascript
await platformApi.sendMessage(
  companyId,      // Required
  'Welcome',      // Subject
  'Hello ABC Co', // Message
  adminId         // Optional - leave null to send to all admins
);
```

### Send Message (Company to Platform)

```javascript
await api.post('/messages', {
  subject: 'Hello Platform',
  message: 'I have a question about my plan'
});
```

### Reply to Message

```javascript
// Platform replies to company message
await platformApi.replyToMessage(messageId, 'Thanks for reaching out!');

// Company replies to platform message
await api.post(`/messages/${messageId}/reply`, {
  message: 'Thank you for your help!'
});
```

### Get Companies List (with search)

```javascript
const companies = await platformApi.getCompaniesList('ABC');
// Returns: [{ id: 1, name: 'ABC Logistics', email: 'admin@abc.com' }]
```

### Get Company Admins

```javascript
const admins = await platformApi.getCompanyAdmins(companyId);
// Returns: [{ id: 5, name: 'John Admin', email: 'john@abc.com' }]
```

## Database Impact

| Field | Type | Purpose |
|-------|------|---------|
| `company_id` | Foreign Key | Links message to company |
| `from_user_id` | Foreign Key | Who sent the message |
| `to_user_id` | Foreign Key | Specific recipient (null = all admins) |
| `from_type` | ENUM | Platform or Company origin |
| `to_type` | ENUM | Intended recipient type |
| `subject` | String | Message headline |
| `message` | Text | Full message content |
| `body` | Text | Alternative message field |
| `read` | Boolean | Has recipient viewed it? |
| `read_at` | Timestamp | When was it read? |
| `status` | ENUM | draft, sent, read, archived |
| `attachments` | JSON | File references (future) |

## Common Use Cases

### Use Case 1: Announcing Maintenance

```
Platform Admin:
Subject: Scheduled Maintenance on June 25th
Message: Dear Partner,

We have scheduled maintenance on June 25th from 2-4 AM UTC.
During this time, the platform will be offline.

We apologize for any inconvenience.
```

**What happens:**
- Message sent to all companies
- Each company admin receives notification
- Companies can reply with questions
- Platform admin sees all replies

### Use Case 2: Company Support Request

```
Company Admin:
Subject: Need Help with Integration
Message: Hi,

We're trying to integrate our existing system with GoldFleet API.
Can someone from your technical team help us with this?

Thanks!
```

**What happens:**
- Platform admins see new message
- All platform admins get notification
- They can reply directly
- Company gets notification of response
- Conversation continues back and forth

### Use Case 3: Billing Inquiry

```
Company Admin:
Subject: Question about Renewal
Message: Our subscription renews next month.
Can I get details on billing dates and amounts?
```

**What happens:**
- Platform admin sees message
- Can reply with payment information
- Company receives reply
- Full conversation history preserved

## Troubleshooting

### Message Not Showing in Compose
**Issue**: Company not appearing in search
**Solution**: Verify company has been approved (status = 'approved')

### Can't See Message I Sent
**Issue**: Sent message doesn't appear in inbox
**Solution**: 
- Check page refresh (click Refresh button)
- Verify you're in correct inbox (Platform vs Company)
- Check browser console for errors

### Notification Not Received
**Issue**: Didn't see notification for new message
**Solution**:
- Notification system requires polling
- Notifications appear in notification center
- Check unread count badge in header

### Company Admin List Empty
**Issue**: No admins appear after selecting company
**Solution**: 
- Company may need team members added
- Verify selected company has admin users
- Try selecting different company

## Performance Notes

- Messages are paginated (20 per page)
- Company search is real-time (debounced)
- Admin lists load after company selection
- Full conversations load on-demand
- Unread count updates automatically

## Security Features

✅ Company users can only message their own company
✅ Platform users can only send to approved companies  
✅ Users cannot see other company's messages
✅ Message recipients verified
✅ Company-user relationships enforced
✅ Soft-delete for archive functionality
✅ Input validation on all fields

## What's Next?

After implementing the messaging system:

1. **Test thoroughly**
   - Send messages between platform and company
   - Verify notifications work
   - Test search functionality
   - Check pagination

2. **Optional Enhancements**
   - Add file attachments
   - Enable message templates
   - Set up message scheduling
   - Add automated responses

3. **Monitoring**
   - Track message volume
   - Monitor response times
   - Review message sentiment
   - Identify common issues

## Need Help?

Refer to:
- [Full Implementation Guide](./MESSAGING_SYSTEM_IMPLEMENTATION.md)
- Controller code comments
- API Response error messages
- Browser Console for JavaScript errors
- Server Logs: `php artisan logs`

---

**Ready to go!** Your messaging system is now live and ready to use. Start sending messages to your companies today! 🚀
