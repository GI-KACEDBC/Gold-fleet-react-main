# Messaging System Quick Reference Card

## API Endpoints at a Glance

### 🏢 Company User Endpoints
```
GET    /api/messages                    → List messages (pagination)
POST   /api/messages                    → Send message to platform
GET    /api/messages/{id}               → View message detail
POST   /api/messages/{id}/reply         → Reply to message
PATCH  /api/messages/{id}/read          → Mark message as read
DELETE /api/messages/{id}               → Delete message
```

### 🏛️ Platform Admin Endpoints
```
GET    /api/platform/messages           → List company messages (pagination)
POST   /api/platform/messages           → Send message to company
GET    /api/platform/messages/{id}      → View message detail
POST   /api/platform/messages/{id}/reply → Reply to company
PATCH  /api/platform/messages/{id}/read → Mark as read
GET    /api/platform/companies-list     → Search companies (real-time)
GET    /api/platform/company/{id}/admins → Get company admins
```

---

## Frontend Usage

### PlatformMessages Component
```javascript
// Import
import PlatformMessages from '../platform/pages/PlatformMessages.jsx';

// Features:
// - Real-time company search dropdown
// - Message composition form
// - Message list with pagination
// - Message detail/reply view
// - Search filtering
// - Notification count badge
```

### MessagingPage Component
```javascript
// Import
import MessagingPage from '../pages/MessagingPage.jsx';

// Features:
// - Send messages to platform
// - View platform responses
// - Message search
// - Pagination
// - Reply interface
```

---

## API Service Methods

```javascript
// Get messages (both platforms)
platformApi.getMessages(page = 1, limit = 10)
api.get('/messages', { params: { page, limit } })

// Send message
platformApi.sendMessage(companyId, subject, message, toUserId)
api.post('/messages', { subject, message })

// Reply to message
platformApi.replyToMessage(messageId, message)
api.post(`/messages/${messageId}/reply`, { message })

// Mark as read
platformApi.markMessageAsRead(messageId)
api.patch(`/messages/${messageId}/read`)

// Get companies list (Platform only)
platformApi.getCompaniesList(search = '')

// Get company admins (Platform only)
platformApi.getCompanyAdmins(companyId)
```

---

## Database Fields Quick Reference

| Field | Type | Purpose |
|-------|------|---------|
| id | PK | Unique identifier |
| company_id | FK | Which company |
| from_user_id | FK | Message sender |
| to_user_id | FK | Message recipient (null = all) |
| from_type | ENUM | 'platform' or 'company' |
| to_type | ENUM | 'platform' or 'company' |
| subject | VARCHAR(255) | Message title |
| message | LONGTEXT | Message content |
| body | LONGTEXT | Alternative content field |
| read | BOOLEAN | Has it been read? |
| read_at | TIMESTAMP | When read? |
| status | ENUM | draft/sent/read/archived |
| attachments | JSON | File references |
| created_at | TIMESTAMP | Sent time |
| updated_at | TIMESTAMP | Updated time |
| deleted_at | TIMESTAMP | Soft delete |

---

## Common Tasks

### Send Message to Company
```javascript
const response = await platformApi.sendMessage(
  1,                           // Company ID
  "Important Update",          // Subject
  "Please review your plan",   // Message
  5                            // Admin ID (optional)
);
```

### Reply to Company Message
```javascript
const response = await platformApi.replyToMessage(
  12,                          // Message ID
  "Thanks for your question!"  // Reply text
);
```

### Search Companies
```javascript
const companies = await platformApi.getCompaniesList('ABC');
// Returns: [{ id: 1, name: 'ABC Logistics', email: '...' }]
```

### Get Company Admins
```javascript
const admins = await platformApi.getCompanyAdmins(1);
// Returns: [{ id: 5, name: 'John', email: '...' }, ...]
```

---

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | ✅ Success | Message fetched/sent successfully |
| 201 | ✅ Created | Message created |
| 400 | ❌ Bad request | Required field missing |
| 403 | ❌ Unauthorized | Not allowed to access this |
| 404 | ❌ Not found | Message doesn't exist |
| 422 | ❌ Validation error | Invalid input data |
| 500 | ❌ Server error | Database or server error |

---

## Error Handling

```javascript
try {
  const response = await platformApi.sendMessage(companyId, subject, message);
  console.log('Success:', response.data);
} catch (error) {
  console.error('Error:', error.response?.data?.message);
  console.error('Validation errors:', error.response?.data?.errors);
}
```

---

## Authentication

### Platform Admin
- Uses `platformToken` from sessionStorage
- Set during login: `sessionStorage.setItem('platformToken', token)`
- Added to all `/api/platform/*` requests

### Company User
- Uses `authToken` from sessionStorage
- Set during login
- Added to `/api/messages` requests

---

## Files Location Summary

```
Backend:
├── Message Model
│   └── backend/app/Models/Message.php
├── Controllers
│   ├── backend/app/Http/Controllers/MessageController.php
│   └── backend/app/Http/Controllers/Api/PlatformMessageController.php
├── Routes
│   └── backend/routes/api.php
└── Migration
    └── backend/database/migrations/2024_03_11_upgrade_messages_table.php

Frontend:
├── Services
│   └── frontend/src/platform/services/platformApi.js
├── Pages
│   ├── frontend/src/platform/pages/PlatformMessages.jsx
│   └── frontend/src/pages/MessagingPage.jsx
└── Documentation
    ├── MESSAGING_SYSTEM_IMPLEMENTATION.md
    ├── MESSAGING_QUICK_START.md
    ├── BIDIRECTIONAL_MESSAGING_COMPLETE.md
    └── MESSAGING_QUICK_REFERENCE.md (this file)
```

---

## Migration Checklist

- [ ] Run: `php artisan migrate`
- [ ] Verify table columns added
- [ ] Test message creation
- [ ] Test company search
- [ ] Test notifications
- [ ] Test on both platform and company sides

---

## Troubleshooting

### 404 Error on /api/platform/messages
- Check routes are imported in api.php
- Verify PlatformMessageController exists
- Check Bearer token in Authorization header

### Company search returns no results
- Verify companies have status = 'approved'
- Check company name contains search term
- Review network request in DevTools

### Message not appearing after send
- Click refresh button
- Check browser console for errors
- Verify message create response shows success: true
- Check database directly

### Notification not showing
- Verify Notification model exists
- Check notification creation in controller
- Check frontend polls notification endpoint

---

## Performance Tips

- Message lists are paginated (20/page) - set limit in API call
- Company search is debounced - add debounce(300) in input
- Use eager loading - relationships pre-loaded
- Index on (company_id, created_at) for sorting
- Cache company list if search is slow

---

## Security Checklist

- ✅ All endpoints require authentication
- ✅ Company users can't access other companies' messages
- ✅ Platform admins verified before sending
- ✅ User-company relationship checked
- ✅ Input validation on all fields
- ✅ SQL injection protected (parameterized queries)
- ✅ XSS protection via React escaping
- ✅ Soft deletes preserve data

---

## Development Notes

### Adding a New Endpoint
1. Create method in controller
2. Add route in api.php
3. Add method in platformApi.js
4. Call from React component
5. Add error handling
6. Write tests

### Customizing Message Fields
1. Add column to migration
2. Add to $fillable in Message model
3. Update validation rules in controller
4. Pass in API request
5. Update frontend form

### Extending with Attachments
1. Enable file upload in form
2. Validate file type/size
3. Store file reference in JSON
4. Download/preview in message view

---

## Quick Debugging

Check these first when something breaks:

1. **Database**
   ```sql
   SELECT * FROM messages LIMIT 1;
   DESC messages; -- Check all columns exist
   ```

2. **Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

3. **API Response**
   ```javascript
   // Check in console
   console.log(response.data);
   ```

4. **Network Request**
   - DevTools → Network → Messages → Headers/Response

5. **Component State**
   - DevTools → React Components → Check props/state

---

## Support Resources

- Full Guide: `MESSAGING_SYSTEM_IMPLEMENTATION.md`
- Quick Start: `MESSAGING_QUICK_START.md`
- Complete Summary: `BIDIRECTIONAL_MESSAGING_COMPLETE.md`
- This Card: `MESSAGING_QUICK_REFERENCE.md`

---

**Last Updated:** March 11, 2026  
**Version:** 1.0  
**Status:** Production Ready
