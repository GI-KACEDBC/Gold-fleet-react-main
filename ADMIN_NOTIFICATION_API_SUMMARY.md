# Admin Notification & Messaging API Summary

## Quick Overview

The Gold Fleet backend has **5 main systems** for notifying company admins:

---

## 1️⃣ VEHICLE ISSUE REPORTING

### Endpoint: `POST /api/issues`
**Accepts:** Vehicle damage/issue data with optional photo  
**File:** [IssueController.php](Gold-fleet-react-main/app/Http/Controllers/IssueController.php#L30)

**Request:**
```json
{
  "vehicle_id": 1,
  "title": "Windshield Cracked",
  "description": "Damage from road debris",
  "priority": "high",
  "photo": "file"
}
```

**What Happens:**
- ✅ Creates Issue record
- ✅ Auto-calls `notifyAdmins()` method
- ✅ Creates Notification for ALL company admins/owners
- ✅ Notification type: `issue_created`
- ✅ Includes: issue_id, vehicle_id, driver_id, priority

**Location:** Lines 30-82 in IssueController

---

## 2️⃣ MAINTENANCE CHECKLIST REPORTING

### Endpoint: `POST /api/inspections/submit-checklist`
**Accepts:** Driver-submitted maintenance checklist  
**File:** [InspectionController.php](Gold-fleet-react-main/app/Http/Controllers/InspectionController.php#L270)

**Request:**
```json
{
  "vehicle_id": 1,
  "checklist_items": [
    {
      "name": "Brakes",
      "checked": true,
      "notes": "Pads need replacement"
    }
  ],
  "notes": "Vehicle ready for trip",
  "trip_id": 5
}
```

**What Happens:**
- ✅ Creates Inspection record
- ✅ Auto-calls `notifyAdminsOfChecklist()` method
- ✅ Creates Notification for ALL company admins
- ✅ Notification type: `inspection_checklist`
- ✅ Source type: `driver_checklist`
- ✅ Includes: driver_name, vehicle_name, action_url, inspection_id

**Location:** Lines 256-302 in InspectionController

---

## 3️⃣ AUTO-ISSUE CREATION FROM INSPECTION FAILURES

### When: During inspection item evaluation  
**File:** [InspectionController.php](Gold-fleet-react-main/app/Http/Controllers/InspectionController.php#L45)

**Trigger:**
```php
if ($item['status'] === 'fail') {
    Issue::create([...]);  // Auto-creates issue
}
```

**What Gets Created:**
- Issue with title: "Inspection Failed: {item_name}"
- Priority: `high`
- Status: `open`
- Description: Item failure notes
- Triggers the same `notifyAdmins()` notification system

**Location:** Lines 45-54 in InspectionController.store()

---

## 4️⃣ MESSAGE ENDPOINTS

### A) Company Team → Platform Admin (Company Users)
**Endpoint:** `POST /api/messages`  
**File:** [MessageController.php](Gold-fleet-react-main/app/Http/Controllers/MessageController.php#L80)

**Request:**
```json
{
  "subject": "Help needed with account",
  "message": "We have an issue...",
  "to_user_id": 5
}
```

**What Happens:**
- ✅ Creates Message record (from_type=company, to_type=platform)
- ✅ Auto-calls `notifyPlatformAdmin()` method
- ✅ Creates Notification for ALL platform_admin users
- ✅ Notification type: `message`
- ✅ Source type: `company_user`
- ✅ **Important:** Works BEFORE company approval

**Location:** Lines 80-128 in MessageController

---

### B) Platform Admin → Company Team (Admin Messaging)
**Endpoint:** `POST /api/platform/messages`  
**File:** [PlatformMessageController.php](Gold-fleet-react-main/app/Http/Controllers/Api/PlatformMessageController.php#L67)

**Request (Platform Admin Only):**
```json
{
  "company_id": 1,
  "to_user_id": null,
  "subject": "Your subscription status",
  "message": "Update on your service"
}
```

**What Happens:**
- ✅ Creates Message record (from_type=platform, to_type=company)
- ✅ Auto-calls `notifyCompanyUsers()` method
- ✅ If `to_user_id` provided: notifies specific user
- ✅ If `to_user_id` null: notifies ALL company admins
- ✅ Creates Notification for each recipient
- ✅ Notification type: `message`
- ✅ Source type: `platform_admin`

**Location:** Lines 67-128 in PlatformMessageController

---

## 5️⃣ CONVERSATION ENDPOINTS

### Real-time Bidirectional Messaging
**Routes:**
- `GET /api/conversations` - View company admin's conversations
- `POST /api/conversations` - Create new conversation with platform
- `POST /api/conversations/{id}/messages` - Send message in thread
- `PATCH /api/conversations/{id}/close` - Close conversation thread

**File:** [ConversationController.php](Gold-fleet-react-main/app/Http/Controllers/ConversationController.php)

Maintains persistent conversation threads between company and platform admins.

---

## 6️⃣ GENERAL NOTIFICATION ENDPOINTS

**Route:** `GET /api/notifications`  
**File:** [NotificationController.php](Gold-fleet-react-main/app/Http/Controllers/NotificationController.php#L7)

- Returns last 10 notifications for authenticated user
- Returns unread_count
- Can be company-wide or user-specific

**Filtered by Type:**
- `GET /api/notifications/by-source/{sourceType}`
- `GET /api/notifications/inspections`
- `GET /api/notifications/driver-checklists`
- `GET /api/notifications/admin-messages`

---

## 📊 Notification Trigger Chain

```
Vehicle Issue Reported
    ↓
POST /api/issues
    ↓
IssueController.store()
    ↓
$this->notifyAdmins($issue)
    ↓
Creates Notification for each admin
    ↓
Company admins see notification
    ↓
GET /api/notifications returns it
```

---

## Authorization Note

⚠️ **Important:** Issue reporting and messaging work **BEFORE** company approval
- Company users can report issues: **NO approval needed**
- Company users can send messages: **NO approval needed**
- Notifications route: **NO approval needed**
- BUT: Fleet management features (vehicles, drivers, trips): **Approval REQUIRED**

---

## Key Database Tables

- `issues` - Stores damage/problem reports
- `inspections` - Stores maintenance checklists
- `inspection_items` - Individual checklist items
- `messages` - Company ↔ Platform bidirectional messages
- `notifications` - All alerts/notifications
- `conversations` - Conversation threads
- `conversation_messages` - Individual messages in threads

---

## Entry Point Reference

All routes are prefixed with `/api/` and protected by `authorize.api.token` middleware.

See [routes/api.php](Gold-fleet-react-main/routes/api.php) for complete route definitions:
- Lines 165-179: Admin messaging routes with `role:admin` middleware
- Lines 152-163: Company messaging routes (no approval needed)
- Lines 204-217: Inspection/Issue/reminder routes with `ensure.company.approved` middleware
- Lines 125-151: Profile, notifications, conversations (no approval)
