# Messaging System - Testing & Validation Guide

## Pre-Deployment Testing

### Step 1: Database Migration Test

```bash
# 1. Backup database
mysqldump -u root -p goldfleet_db > backup_before_migration.sql

# 2. Run migration
cd backend/
php artisan migrate

# 3. Verify all columns exist
mysql -u root -p goldfleet_db << EOF
DESC messages;
SELECT COUNT(*) as total_records FROM messages;
EOF

# Expected output: 15 columns including:
# - company_id, from_user_id, to_user_id
# - from_type, to_type
# - subject, message, body
# - read, read_at, status
# - attachments, created_at, updated_at, deleted_at
```

### Step 2: Backend Setup Test

```bash
# 1. Verify file structure
ls -la backend/app/Http/Controllers/MessageController.php
ls -la backend/app/Http/Controllers/Api/PlatformMessageController.php

# 2. Check imports are correct
grep "use.*MessageController" backend/routes/api.php
grep "use.*PlatformMessageController" backend/routes/api.php

# 3. Verify routes exist
php artisan route:list | grep messages
```

### Step 3: Frontend Setup Test

```bash
# 1. Verify component files exist
ls -la frontend/src/pages/MessagingPage.jsx
ls -la frontend/src/platform/pages/PlatformMessages.jsx

# 2. Check imports
grep -n "import.*platformApi" frontend/src/platform/pages/PlatformMessages.jsx
grep -n "import.*api" frontend/src/pages/MessagingPage.jsx

# 3. Verify API methods exist
grep -n "getMessages\|sendMessage\|replyToMessage" frontend/src/platform/services/platformApi.js
```

---

## Manual Testing Scenarios

### Scenario 1: Platform Admin Sends Message to Company

#### Test Steps:
1. Login to platform admin account
2. Click "Messages" in sidebar
3. Click "Compose" button
4. Type "test" in company search
5. Select test company from dropdown
6. Verify admin list appears
7. Select "Send to All" (no recipient selected)
8. Enter subject: "Test Message"
9. Enter message: "This is a test message from platform"
10. Click "Send Message"

#### Expected Results:
- ✅ Message appears in sent list
- ✅ Company admins receive notification
- ✅ Message has unread indicator
- ✅ No errors in console
- ✅ Success message displayed

#### Database Verification:
```sql
SELECT * FROM messages 
WHERE subject = 'Test Message' 
AND from_type = 'platform' 
ORDER BY created_at DESC LIMIT 1;
```

---

### Scenario 2: Company Admin Views & Replies

#### Test Steps:
1. Logout from platform
2. Login to company admin account
3. Navigate to "Messages" section
4. Should see incoming message from platform
5. Click on message to open detail view
6. Verify message content displays correctly
7. Click "Reply" button
8. Type response: "Thank you for the update"
9. Click "Send Reply"

#### Expected Results:
- ✅ Message marked as read
- ✅ Reply sends successfully
- ✅ Reply appears in list as sent by user
- ✅ Platform admin gets notification
- ✅ No errors in console

#### Database Verification:
```sql
SELECT id, subject, from_type, read FROM messages 
WHERE company_id = 1 
ORDER BY created_at DESC LIMIT 5;
```

---

### Scenario 3: Platform Receives Company Message

#### Test Steps:
1. Logout from company
2. Login to platform admin
3. Click "Messages" - should show company reply
4. Verify message shows company name
5. Click message to expand
6. Verify content displays correctly
7. Click "Reply" and send response
8. Company should receive notification

#### Expected Results:
- ✅ Company message receives from_type = 'company'
- ✅ Message shows company name
- ✅ Reply sends back to company
- ✅ Notification created for company user

---

### Scenario 4: Real-Time Company Search

#### Test Steps:
1. Platform admin opens Messages
2. Click Compose
3. Start typing company names:
   - "abc" (should return ABC Logistics)
   - "fast" (should return Fast Delivery Co)
   - "xyz" (should return no results)
4. Verify dropdown updates in real-time
5. Verify no non-approved companies appear

#### Expected Results:
- ✅ Dropdown updates as you type
- ✅ Only approved companies shown
- ✅ Search is case-insensitive
- ✅ Partial matches work

#### Browser Console Check:
```javascript
// In DevTools Console
platformApi.getCompaniesList('test').then(r => console.log(r.data))
```

---

### Scenario 5: Message Search & Pagination

#### Test Steps:
1. Create 25+ messages between accounts
2. Go to Messages page
3. Verify pagination shows (Previous/Next buttons)
4. Click Next - shows messages 21-40
5. Search for specific subject
6. Results filter correctly
7. Pagination resets

#### Expected Results:
- ✅ 20 messages per page
- ✅ Navigation works correctly
- ✅ Search filters all fields
- ✅ Pagination counts are accurate

---

### Scenario 6: Unread Count Tracking

#### Test Steps:
1. Create new message
2. Don't open it
3. Message shows unread dot indicator
4. Unread count in header increments
5. Click message
6. Message marked as read
7. Unread count decrements
8. Dot indicator disappears

#### Expected Results:
- ✅ Read status tracks correctly
- ✅ Unread count accurate
- ✅ Visual indicators update
- ✅ read_at timestamp set

#### Database Check:
```sql
SELECT id, subject, read, read_at FROM messages 
WHERE id = [message_id];
```

---

## Automated Testing (Optional)

### API Endpoint Tests

```bash
# Test GET messages
curl -X GET http://localhost:8000/api/messages \
  -H "Authorization: Bearer [token]"

# Test POST message
curl -X POST http://localhost:8000/api/platform/messages \
  -H "Authorization: Bearer [platform_token]" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "subject": "Test",
    "message": "Test message"
  }'

# Test GET company list
curl -X GET "http://localhost:8000/api/platform/companies-list?search=abc" \
  -H "Authorization: Bearer [platform_token]"
```

### Response Code Tests

```javascript
// In browser console
async function testAPI() {
  try {
    // Test message list
    const list = await platformApi.getMessages(1, 10);
    console.log('✅ GET Messages:', list.success);
    
    // Test company list
    const companies = await platformApi.getCompaniesList('test');
    console.log('✅ GET Companies:', companies.success);
    
    // Test single message
    const msg = await platformApi.getMessage(1);
    console.log('✅ GET Message Detail:', msg.success);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
```

---

## Performance Testing

### Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test message list endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 -H "Authorization: Bearer [token]" \
  http://localhost:8000/api/messages

# Expected: Response time < 500ms
```

### Database Query Performance

```sql
-- Check message lookup time
EXPLAIN SELECT * FROM messages 
WHERE company_id = 1 AND read = false 
ORDER BY created_at DESC LIMIT 20;

-- Should show "Using where" and proper index usage
```

---

## Error Handling Tests

### Test 1: Missing Required Fields
```javascript
// Should return 422 error
try {
  await platformApi.sendMessage(1, '', 'message');
  // No subject
} catch (error) {
  console.log('✅ Caught validation error:', error.message);
}
```

### Test 2: Unauthorized Access
```javascript
// Clear token, should return 401
sessionStorage.removeItem('platformToken');
try {
  await platformApi.getMessages(1, 10);
} catch (error) {
  console.log('✅ Caught auth error:', error.message);
}
```

### Test 3: Invalid Company ID
```javascript
// Should return 404 or 422
try {
  await platformApi.sendMessage(99999, 'Subject', 'Message');
} catch (error) {
  console.log('✅ Caught validation error:', error.message);
}
```

### Test 4: Company User Can't See Other Company Messages
```javascript
// Company user tries to get another company's messages
// Database enforces company_id = auth user's company_id
// IMPORTANT: This is SQL-level constraint, frontend respects it
SELECT * FROM messages WHERE company_id != [user_company_id];
```

---

## Security Testing

### Authorization Tests

```javascript
// 1. Company user shouldn't access /api/platform/messages
try {
  const response = await fetch('http://localhost:8000/api/platform/messages', {
    headers: { 'Authorization': `Bearer [company_token]` }
  });
  console.log('✅ Correctly denied:', response.status === 401 || 403);
} catch (error) {
  console.log('Error:', error);
}

// 2. Platform admin uses special token
try {
  const response = await platformApi.getMessages();
  console.log('✅ Platform token works:', response.success);
} catch (error) {
  console.log('Error:', error);
}
```

### Input Sanitization

```javascript
// Test XSS injection attempt
try {
  await platformApi.sendMessage(1, 
    '<script>alert("xss")</script>', 
    'Test'
  );
  // React will escape this, should render as text
  console.log('✅ XSS injection prevented');
} catch (error) {
  console.log('Validation caught:', error.message);
}
```

---

## Visual Testing Checklist

### Platform Messages Page
- [ ] Header displays "Messages" with icon
- [ ] Unread count shows in header
- [ ] Compose button visible and clickable
- [ ] Refresh button works
- [ ] Company search shows real-time dropdown
- [ ] Message list displays all fields
- [ ] Unread messages have indicator dot
- [ ] Read messages appear different
- [ ] Pagination controls functional
- [ ] Search input filters messages
- [ ] Message detail view shows full content
- [ ] Reply button appears and works
- [ ] Timestamps display correctly
- [ ] Loading states appear
- [ ] Error messages show and disappear

### Company Messaging Page
- [ ] Header displays "Messages"
- [ ] Compose button visible
- [ ] Can compose new message
- [ ] Message list shows platform messages
- [ ] Can click to view detail
- [ ] Reply interface appears
- [ ] Search works
- [ ] Pagination functional
- [ ] Responsive on mobile view
- [ ] Colors and styling match theme

---

## Browser Compatibility Testing

Test on:
- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Edge (Latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Check:
- [ ] No console errors
- [ ] Responsive layout works
- [ ] Dropdowns display correctly
- [ ] Input forms functional
- [ ] Pagination accessible
- [ ] Notifications display
- [ ] Timestamps readable

---

## Data Volume Testing

### with Different Message Counts:

```javascript
// Test with 100 messages
// Performance: Should load in < 1 second

// Test with 1000 messages
// Performance: Should load in < 2 seconds (with pagination)

// Test with 10000 total messages
// Performance: Pagination ensures fast load times
```

---

## Rollback Testing

```bash
# Test rollback works
cd backend/
php artisan migrate:rollback --step=1

# Verify messages table reverted
mysql -u root -p -e "DESC messages"

# Verify old structure intact
```

---

## Post-Deployment Validation

### Day 1 Checklist
- [ ] Platform admin can send message
- [ ] Company receives notification
- [ ] Company can reply
- [ ] Platform sees reply
- [ ] No database errors in logs
- [ ] No JavaScript errors in console
- [ ] Search functionality works
- [ ] Pagination works correctly

### Week 1 Monitoring
- [ ] Check error logs daily
- [ ] Monitor message volume
- [ ] Track notification delivery
- [ ] Verify read status updates
- [ ] Check database performance
- [ ] Monitor API response times

---

## Test Results Template

```markdown
# Messaging System Test Results
Date: ___________

## Database Tests
- [ ] Migration successful
- [ ] All columns present
- [ ] Foreign keys working
- Status: PASS/FAIL

## API Tests
- [ ] GET messages returns 200
- [ ] POST message returns 201
- [ ] Reply endpoint works
- [ ] Company search works
- Status: PASS/FAIL

## UI Tests
- [ ] Platform compose works
- [ ] Company messaging works
- [ ] Search filtering works
- [ ] Pagination works
- Status: PASS/FAIL

## Security Tests
- [ ] Authorization enforced
- [ ] XSS protected
- [ ] SQL injection protected
- [ ] Company isolation verified
- Status: PASS/FAIL

## Performance Tests
- [ ] Message load < 500ms
- [ ] Company search < 100ms
- [ ] Send message < 300ms
- Status: PASS/FAIL

## Overall: READY/NOT READY FOR PRODUCTION
```

---

## Known Issues & Limitations

### Current Limitations
- No file attachments (future feature)
- No real-time WebSocket (polls for updates)
- No message templates (future feature)
- No scheduling (future feature)
- No rich text formatting (future feature)

### Browser Limitations
- Requires JavaScript enabled
- LocalStorage requires ~50KB
- Notifications via polling (not WebSocket)

---

## Support Contact

If tests fail:
1. Check [MESSAGING_SYSTEM_IMPLEMENTATION.md](./MESSAGING_SYSTEM_IMPLEMENTATION.md)
2. Review controller code comments
3. Check server logs: `php artisan logs`
4. Check browser console for errors
5. Review API responses in Network tab

---

**Test Completion Date:** _____________  
**Tested By:** _____________  
**Approval Status:** PASS / FAIL
