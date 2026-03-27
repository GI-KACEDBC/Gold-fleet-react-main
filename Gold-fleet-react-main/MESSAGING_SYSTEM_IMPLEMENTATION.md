# Complete Bidirectional Messaging System - Implementation Guide

## Overview
This document describes the complete implementation of a bidirectional real-time messaging system between the platform (administrator) and tenant companies.

## Architecture

### Components Implemented

1. **Message Model** (`backend/app/Models/Message.php`)
   - Enhanced with company/user relationships
   - Supports bidirectional messaging (platform ↔ company)
   - Includes read status tracking
   - Message type classification (platform vs company origin)

2. **Controllers**
   - **MessageController** - Company-side message handling
   - **PlatformMessageController** - Platform admin message handling
   - Located in `backend/app/Http/Controllers/`
   - Located in `backend/app/Http/Controllers/Api/`

3. **Frontend Services**
   - **platformApi.js** - Enhanced with complete message methods
   - Methods for getting messages, sending, replying, marking as read
   - Company list retrieval with real-time search
   - Admin list retrieval by company

4. **Frontend Pages**
   - **PlatformMessages.jsx** - Platform admin messaging interface
   - **MessagingPage.jsx** - Company user messaging interface

## API Endpoints

### Platform Admin Endpoints (`/api/platform/messages`)

```
GET    /api/platform/messages                          - List all messages from companies
POST   /api/platform/messages                          - Send message to company
GET    /api/platform/messages/{id}                     - View specific message
POST   /api/platform/messages/{id}/reply               - Reply to company message
PATCH  /api/platform/messages/{id}/read                - Mark message as read
GET    /api/platform/companies-list?search=...         - Search registered companies (real-time)
GET    /api/platform/company/{companyId}/admins        - Get company admin list
```

### Company User Endpoints (`/api/messages`)

```
GET    /api/messages                                   - List messages with platform
POST   /api/messages                                   - Send message to platform
GET    /api/messages/{id}                              - View specific message
POST   /api/messages/{id}/reply                        - Reply to platform message
PATCH  /api/messages/{id}/read                         - Mark message as read
DELETE /api/messages/{id}                              - Delete message
```

## Database Schema

### Messages Table Structure

```sql
CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    company_id BIGINT UNSIGNED (Foreign Key → companies)
    from_user_id BIGINT UNSIGNED (Foreign Key → users)
    to_user_id BIGINT UNSIGNED (Foreign Key → users, nullable)
    from_type ENUM('platform', 'company') DEFAULT 'company',
    to_type ENUM('platform', 'company') DEFAULT 'platform',
    name VARCHAR(255),
    email VARCHAR(255),
    subject VARCHAR(255),
    message LONGTEXT,
    body LONGTEXT,
    status ENUM('draft', 'sent', 'read', 'archived') DEFAULT 'sent',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    attachments JSON NULL,
    deleted_at TIMESTAMP NULL (Soft Delete),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Apply Migration

```bash
cd backend/
php artisan migrate
```

## Features

### 1. Real-Time Company Selection (Platform Side)
- Dropdown with live search functionality
- Only shows approved companies
- Displays company name and email
- Automatic admin list loading when company selected

### 2. Message Composition
- Rich text message support
- Subject line requirement
- Optional recipient selection (all admins if not specified)
- Attachment support (JSON field)
- Draft status support

### 3. Message Threading
- Reply to specific messages
- Conversation history
- Reply counter
- Related message linking

### 4. Notification System
- Automatic notification creation for recipients
- Unread message count tracking
- Read status timestamps
- Soft delete support for archive functionality

### 5. Search & Filtering
- Search by company name
- Search by message subject
- Search by message content
- Pagination support (20-50 per page)

## Frontend Usage

### For Platform Admin (PlatformMessages.jsx)

```javascript
// Compose flow
1. Click "Compose" button
2. Search for company in real-time dropdown
3. (Optional) Select specific admin recipient
4. Enter subject line
5. Enter message content
6. Send message

// View flow
1. Message appears in list
2. Click to expand for full content
3. Reply with direct response
4. Message automatically marked as read
```

### For Company Users (MessagingPage.jsx)

```javascript
// Send message flow
1. Navigate to "Messages" section in dashboard
2. Click "Compose" button
3. Enter subject
4. Enter message
5. Send to platform support

// Reply flow
1. Click on incoming message
2. View full message content
3. Click "Reply" button
4. Type response
5. Send reply
```

## Backend Integration Steps

### Step 1: Database Setup
```bash
# Run migration to update messages table
cd backend/
php artisan migrate
```

### Step 2: Verify Controllers
- Ensure `MessageController.php` exists in `backend/app/Http/Controllers/`
- Ensure `PlatformMessageController.php` exists in `backend/app/Http/Controllers/Api/`
- Both controllers should inherit from `Controller` class

### Step 3: Check Routes
Routes should be configured in `backend/routes/api.php`:

For company users (NO approval required):
```php
Route::get('/messages', [MessageController::class, 'index']);
Route::post('/messages', [MessageController::class, 'store']);
Route::get('/messages/{message}', [MessageController::class, 'show']);
Route::post('/messages/{message}/reply', [MessageController::class, 'reply']);
Route::patch('/messages/{message}/read', [MessageController::class, 'markAsRead']);
Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
```

For platform admins:
```php
Route::get('/messages', [PlatformMessageController::class, 'index']);
Route::post('/messages', [PlatformMessageController::class, 'store']);
Route::get('/messages/{message}', [PlatformMessageController::class, 'show']);
Route::post('/messages/{message}/reply', [PlatformMessageController::class, 'reply']);
Route::patch('/messages/{message}/read', [PlatformMessageController::class, 'markAsRead']);
Route::get('/companies-list', [PlatformMessageController::class, 'getCompaniesList']);
Route::get('/company/{companyId}/admins', [PlatformMessageController::class, 'getCompanyAdmins']);
```

### Step 4: Test with Sample Data

```bash
# Add test companies (through platform signup)
# Add test users to companies
# Send test messages between accounts
```

## Testing Checklist

### Platform Admin Testing
- [ ] Platform admin can login
- [ ] Can see "Messages" link in sidebar
- [ ] Can navigate to Messages page
- [ ] Can compose new message with company search
- [ ] Real-time company search works
- [ ] Can select specific admin or send to all
- [ ] Message sends successfully
- [ ] Receives notification when company replies
- [ ] Can view full conversation
- [ ] Can reply to company messages
- [ ] Messages marked as read when viewed

### Company User Testing
- [ ] Company user can login
- [ ] Can see "Messages" link in sidebar/dashboard
- [ ] Can navigate to Messaging page
- [ ] Can compose new message to platform
- [ ] Message sends successfully
- [ ] Receives notification of platform replies
- [ ] Can view full conversation
- [ ] Can reply to platform messages
- [ ] Search functionality works
- [ ] Pagination works correctly

### Edge Cases
- [ ] Company with no admins (platform can't select admin)
- [ ] Deleted company (should appear in old message threads)
- [ ] Deleted user (message shows "Admin" or "Unknown")
- [ ] Very long message content (display handling)
- [ ] Multiple rapid messages (ordering)
- [ ] Message reply without viewing parent

## Security Considerations

1. **Authorization**
   - Company users can only send/receive messages for their company
   - Platform admins can only send to registered companies
   - Users can only view their own messages

2. **Input Validation**
   - Subject max 255 characters
   - Message content validation
   - Company ID validation (exists check)
   - User ID validation (exists check)

3. **Data Privacy**
   - Messages soft-deleted (not permanently removed)
   - Read at timestamps tracked
   - User relationships enforced
   - Company-user relationship verified

## Performance Optimizations

1. **Eager Loading**
   - Messages load related users and companies in one query
   - Pagination limits result sets to 20 per page

2. **Indexing**
   - Foreign key indexes on company_id, from_user_id, to_user_id
   - Composite index on (company_id, read, created_at)
   - Name/email indexes for search performance

3. **Caching** (Future Enhancement)
   - Cache unread message counts per user
   - Cache company list for admin selection
   - Invalidate on new messages

## Notifications Integration

When a message is sent:

1. **Platform Admin Sends Message**
   - All company admins (or specific admin) receive notification
   - Notification type: "message"
   - Contains message ID for direct viewing

2. **Company User Sends Message**
   - All platform admins receive notification
   - Notification type: "message"
   - Contains company info for context

## Future Enhancements

1. **Real-Time Features**
   - WebSocket integration for live message delivery
   - Typing indicators
   - Online status
   - Message read receipts

2. **Advanced Features**
   - File attachments (with security scanning)
   - Message templates (for common responses)
   - Automated responses/chatbot
   - Message scheduling
   - Rich text editor with formatting

3. **Reporting**
   - Message analytics dashboard
   - Response time metrics
   - Message volume trends
   - Company communication summary

4. **Mobile Support**
   - Push notifications
   - Mobile-optimized UI
   - Offline message queuing
   - Image/file upload from camera

## Troubleshooting

### Messages Not Appearing
1. Verify migration has run: `php artisan migrate:status`
2. Check that user has correct company_id
3. Verify message create/update timestamps

### Company Search Not Working
1. Verify companies have status = 'approved'
2. Check that company names contain search query
3. Review network request in browser DevTools

### Notifications Not Showing
1. Verify Notification model exists and relationship is set
2. Check notification creation code in controllers
3. FrontEnd may need to poll /notifications endpoint

### Authorization Errors (403)
1. Verify user has proper role (admin, company user)
2. Check that company_id matches authenticated user's company
3. Verify message belongs to user's company

## File Locations

```
Backend Files:
- Model: backend/app/Models/Message.php
- Controllers: 
  - backend/app/Http/Controllers/MessageController.php
  - backend/app/Http/Controllers/Api/PlatformMessageController.php
- Routes: backend/routes/api.php
- Migration: backend/database/migrations/2024_03_11_upgrade_messages_table.php

Frontend Files:
- Services: frontend/src/platform/services/platformApi.js
- Pages:
  - frontend/src/platform/pages/PlatformMessages.jsx
  - frontend/src/pages/MessagingPage.jsx
```

## Support

For issues or questions regarding the messaging system:
1. Check this implementation guide
2. Review controller code comments
3. Check API response error messages
4. Review browser console for JavaScript errors
5. Check server logs: `php artisan logs`

---

**Implementation Date:** March 11, 2026
**Version:** 1.0
**Status:** Complete - Ready for Production Testing
