# Email Verification System - Complete Guide

## Overview

Email verification is **required before login**. The system provides multiple ways to verify:
1. **API-based verification** - Direct endpoint (Development)
2. **Verification links** - From logs or API response
3. **Force verify** - For testing (Development only)

## Login Flow with Email Verification

### Step 1: User Attempts Login
```
POST /api/login
{
  "email": "driver@example.com",
  "password": "password123"
}
```

### Step 2: If Email NOT Verified
```json
{
  "success": false,
  "message": "Please verify your email before logging in",
  "code": "EMAIL_NOT_VERIFIED",
  "user_id": 1,
  "email": "driver@example.com",
  "action_required": "email_verification",
  "api_endpoint": "/api/dev/email/user/1/status",
  "instructions": [
    "1. Option A: Use API to get verification link",
    "2. Option B: Check laravel.log for verification link",
    "3. Option C: Force verify in development",
    "4. Then click the link or use verify endpoint"
  ]
}
```

### Step 3: Verify Email Using API
```
POST /api/email/quick-verify
{
  "user_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "✓ Email verified successfully! You can now login.",
  "user": {
    "id": 1,
    "email": "driver@example.com",
    "email_verified_at": "2026-03-24T10:30:15Z"
  },
  "next_step": "Login with your email and password"
}
```

### Step 4: Login Again
Now login will succeed! ✅

## Quick Verification Methods

### Method 1: Quick Verify via API (Fastest)

```bash
# Verify user 1's email
curl -X POST http://localhost:8000/api/email/quick-verify \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/email/quick-verify" \
  -Method POST \
  -Body '{"user_id": 1}' \
  -Headers @{"Content-Type"="application/json"}
```

### Method 2: Verification Link from API

```bash
# Get user verification status with link
curl http://localhost:8000/api/dev/email/user/1/status
```

Copy the `verification_link` and paste in browser.

### Method 3: Check Logs

When you trigger email send, logs show:
```
═══════════════════════════════════════════════════════════════
📧 EMAIL VERIFICATION LINK - DEVELOPMENT MODE
═══════════════════════════════════════════════════════════════
User: John Doe (john@example.com)
🔗 CLICK LINK TO VERIFY EMAIL:
http://localhost:5173/email/verify?id=1&hash=abc123...
═══════════════════════════════════════════════════════════════
```

Copy the URL and paste in browser.

### Method 4: Force Verify (Testing Only - Development)

```bash
curl -X POST http://localhost:8000/api/dev/email/user/1/force-verify
```

PowerShell:
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/user/1/force-verify" -Method POST
```

## API Endpoints

### Verify Email (Public)
```
GET /api/email/verify/{id}/{hash}
```

**Parameters:**
- `id` (integer): User ID
- `hash` (string): SHA-256 hash of user's email

**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": "2026-03-24T10:30:00Z"
  }
}
```

**Response (Already Verified):**
```json
{
  "success": false,
  "message": "Email already verified"
}
```

**Response (Invalid Hash):**
```json
{
  "success": false,
  "message": "Invalid verification link"
}
```

### Send Verification Email (Protected)
```
POST /api/email/send-verification
Authorization: Bearer {token}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

**Response (Already Verified):**
```json
{
  "success": false,
  "message": "Email already verified"
}
```

## Frontend Integration

### Verification Page
File: `frontend/src/pages/EmailVerificationPage.jsx`

The verification page:
1. Extracts `id` and `hash` from URL parameters
2. Calls the backend verification endpoint
3. Displays success/error messages
4. Redirects to login on success

**URL Pattern:**
```
http://localhost:5173/email/verify?id=1&hash=abc123...
```

### Implementation
```javascript
const handleVerify = async () => {
  const response = await fetch(
    `http://localhost:8000/api/email/verify/${id}/${hash}`,
    { method: 'GET', headers: { 'Accept': 'application/json' } }
  );
  const data = await response.json();
  if (response.ok) {
    navigate('/auth', { replace: true });
  }
};
```

## Storage Logs

All email verification activities are logged in:
```
backend/storage/logs/laravel.log
```

### Log Entries

#### 1. Verification Email Sent
```
[timestamp] production.INFO: Email verification notification queued for sending
Message: Email verification notification queued for sending
Data:
  - user_id: 1
  - email: user@example.com
  - verification_url_generated: true
  - timestamp: 2026-03-24T10:15:00Z
```

#### 2. Verification Attempt
```
[timestamp] production.INFO: Email verification attempt
Message: Email verification attempt
Data:
  - user_id: 1
  - hash_provided: abc123... (first 10 chars)
  - ip_address: 192.168.1.1
  - user_agent: Mozilla/5.0...
  - timestamp: 2026-03-24T10:30:00Z
```

#### 3. Verification Success
```
[timestamp] production.INFO: ✓ EMAIL VERIFICATION SUCCESSFUL
Message: ✓ EMAIL VERIFICATION SUCCESSFUL
Data:
  - user_id: 1
  - user_name: John Doe
  - email: john@example.com
  - verified_at: 2026-03-24T10:30:15Z
  - ip_address: 192.168.1.1
  - timestamp: 2026-03-24T10:30:15Z
  - message: User email successfully verified and marked as verified in database
```

#### 4. Verification Already Completed
```
[timestamp] production.WARNING: Email verification attempted for already verified user
Message: Email verification attempted for already verified user
Data:
  - user_id: 1
  - email: john@example.com
  - verified_at: 2026-03-24T10:30:15Z
  - ip_address: 192.168.1.1
```

#### 5. Invalid Hash
```
[timestamp] production.WARNING: Invalid email verification hash
Message: Invalid email verification hash
Data:
  - user_id: 1
  - email: john@example.com
  - provided_hash: invalid... (first 10 chars)
  - expected_hash: abc123... (first 10 chars)
  - ip_address: 192.168.1.1
  - timestamp: 2026-03-24T10:30:00Z
```

## Development Endpoints (Local/Development Only)

### 1. **View All Pending Verifications with Clickable Links**
```
GET http://localhost:8000/api/dev/email/pending-verifications
```

**Features:**
- Shows all users with verification status
- Displays clickable verification links for each user
- Shows summary (total, verified, pending)
- Includes API endpoint for each user

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_users": 5,
    "verified_users": 2,
    "pending_verifications": 3
  },
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "verified": false,
      "status": "⏳ PENDING VERIFICATION",
      "verification_link": "http://localhost:5173/email/verify?id=1&hash=abc123...",
      "api_verification_endpoint": "/api/email/verify/1/abc123..."
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "verified": true,
      "status": "✅ VERIFIED",
      "verified_at": "2026-03-24T10:30:00Z"
    }
  ]
}
```

### 2. **Get Single User Verification Status**
```
GET http://localhost:8000/api/dev/email/user/{userId}/status
```

**Example:**
```
GET http://localhost:8000/api/dev/email/user/1/status
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "verified": false,
    "status": "⏳ PENDING VERIFICATION"
  },
  "verification_link": "http://localhost:5173/email/verify?id=1&hash=abc123...",
  "api_endpoint": "/api/email/verify/1/abc123...",
  "instructions": "Click the verification_link URL above to verify this user's email"
}
```

### 3. **Force Verify Email (Testing Only)**
```
POST http://localhost:8000/api/dev/email/user/{userId}/force-verify
```

**Example:**
```
POST http://localhost:8000/api/dev/email/user/1/force-verify
```

**Response:**
```json
{
  "success": true,
  "message": "User email forcibly verified (DEVELOPMENT ONLY)",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "email_verified_at": "2026-03-24T10:30:15Z"
  }
}
```

### 4. **Resend Verification Email**
```
POST http://localhost:8000/api/dev/email/user/{userId}/resend
```

**Example:**
```
POST http://localhost:8000/api/dev/email/user/1/resend
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent to: john@example.com",
  "development_info": "Check laravel.log for verification link (search for 'CLICK LINK TO VERIFY EMAIL')"
}
```

## How to Approve/Verify Emails from Storage Logs

### Method 1: Click Verification Link from Logs

When you trigger email verification, the logs will show:

```
═══════════════════════════════════════════════════════════════
📧 EMAIL VERIFICATION LINK - DEVELOPMENT MODE
═══════════════════════════════════════════════════════════════
User: John Doe (john@example.com)
User ID: 1
─────────────────────────────────────────────────────────────
🔗 CLICK LINK TO VERIFY EMAIL:
http://localhost:5173/email/verify?id=1&hash=abc123def456...
─────────────────────────────────────────────────────────────
Or open in your application:
Frontend will receive: id=1&hash=abc123def456...
═══════════════════════════════════════════════════════════════
```

**Steps:**
1. Check `backend/storage/logs/laravel.log`
2. Search for: `CLICK LINK TO VERIFY EMAIL`
3. Copy the full URL
4. Paste in browser address bar
5. Email will be automatically verified ✅

### Method 2: Use Development API Endpoint

```powershell
# View all pending verifications
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/pending-verifications" -Method GET

# Get verification link for user 1
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/user/1/status" -Method GET

# Force verify user 1's email
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/user/1/force-verify" -Method POST

# Resend verification email to user 1
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/user/1/resend" -Method POST
```

### Method 3: Use Postman or Thunder Client

**GET** `http://localhost:8000/api/dev/email/pending-verifications`

Response includes all verification links - just click them in the response body.

### Method 4: Check Logs in Real-Time

Terminal:
```powershell
# Windows - PowerShell
Get-Content -Path "backend/storage/logs/laravel.log" -Tail 100 | Select-String -Pattern "CLICK LINK TO VERIFY EMAIL" -Context 3

# Or search for full verification section
Get-Content -Path "backend/storage/logs/laravel.log" -Tail 100 | Select-String -Pattern "EMAIL VERIFICATION LINK" -Context 10
```

### Method 5: Directly Open in Browser

If you know the user ID (usually 1 for first registered user):

```
http://localhost:5173/email/verify?id=1&hash=sha256_hash_here
```

You can get the hash from:
1. The API endpoint response
2. The logs
3. Or calculate it: Hash('sha256', user_email)

## Complete Workflow - From Registration to Verification

### Step 1: Register User (or view existing)
```
Browser: http://localhost:5173/signup
Or API: POST /api/register
```

### Step 2: Trigger Verification Email (if needed)
```
API: POST /api/email/send-verification (requires auth)
Or automatic on registration
```

### Step 3: View Verification Links
**Option A: Check Logs**
```powershell
Get-Content -Path "backend/storage/logs/laravel.log" -Tail 50
# Look for: "CLICK LINK TO VERIFY EMAIL"
```

**Option B: Use Development Endpoint**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/pending-verifications"
```

### Step 4: Click Link to Verify

**From Logs:**
```
Copy URL: http://localhost:5173/email/verify?id=1&hash=abc123...
Paste in browser
Press Enter
```

**From API Response:**
```json
{
  "verification_link": "http://localhost:5173/email/verify?id=1&hash=abc123..."
}
```

### Step 5: Confirmation

**In Browser:**
- Shows "✓ Email verified successfully! Redirecting to login..."

**In Database:**
```bash
php artisan tinker
>>> User::find(1)->email_verified_at
=> Carbon\Carbon @1740213015 {#2949}  // Timestamp = verified ✅
```

**In Logs:**
```
[timestamp] production.INFO: ✓ EMAIL VERIFICATION SUCCESSFUL
  "user_id": 1,
  "user_name": "John Doe",
  "email_verified_at": "2026-03-24T10:30:15Z"
```

## Quick Test Script (Development)

Create file: `backend/test-verification.ps1`

```powershell
# Test Email Verification System
# Run from: backend directory

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   GOLD FLEET EMAIL VERIFICATION TESTING                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$API_BASE = "http://localhost:8000/api"

# 1. View all pending verifications
Write-Host "`n📧 Step 1: Checking all pending verifications..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$API_BASE/dev/email/pending-verifications" -Method GET -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Host "✅ Total Users: $($data.summary.total_users)" -ForegroundColor Green
Write-Host "✅ Verified: $($data.summary.verified_users)" -ForegroundColor Green
Write-Host "⏳ Pending: $($data.summary.pending_verifications)" -ForegroundColor Yellow

# 2. Show verification links
Write-Host "`n🔗 Verification Links:" -ForegroundColor Cyan
$data.users | Where-Object { -not $_.verified } | ForEach-Object {
    Write-Host "   User: $($_.name) ($($_.email))" -ForegroundColor White
    Write-Host "   Link: $($_.verification_link)" -ForegroundColor Green
    Write-Host ""
}

# 3. Check logs
Write-Host "`n📋 Checking logs for verification links..." -ForegroundColor Yellow
$logPath = "storage/logs/laravel.log"
if (Test-Path $logPath) {
    $content = Get-Content $logPath -Tail 100
    $verificationLog = $content | Select-String -Pattern "CLICK LINK TO VERIFY EMAIL" -Context 1
    if ($verificationLog) {
        Write-Host "✅ Found verification link in logs:" -ForegroundColor Green
        Write-Host $verificationLog -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️  No recent verification links in logs" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Log file not found" -ForegroundColor Yellow
}

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Options:" -ForegroundColor Yellow
Write-Host "  1. Click the link above in your browser" -ForegroundColor White
Write-Host "  2. Copy link from verification_link field" -ForegroundColor White
Write-Host "  3. Use API: GET /api/dev/email/pending-verifications" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
```

Run it:
```powershell
cd backend
.\test-verification.ps1
```

## Commands Cheat Sheet

```powershell
# View all users needing verification
curl http://localhost:8000/api/dev/email/pending-verifications

# Get user 1 verification link
curl http://localhost:8000/api/dev/email/user/1/status

# Force verify user 1 (testing only)
curl -X POST http://localhost:8000/api/dev/email/user/1/force-verify

# Resend verification email to user 1
curl -X POST http://localhost:8000/api/dev/email/user/1/resend

# Check logs for verification links
Get-Content backend/storage/logs/laravel.log -Tail 50 | Select-String "CLICK LINK"

# Verify in database
php artisan tinker
>>> User::find(1)->email_verified_at
```

## Database Schema

### Users Table - Relevant Columns
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    email_verified_at TIMESTAMP NULL,  -- NULL = not verified, timestamp = verified
    api_token VARCHAR(255) NULLABLE,
    ...
);
```

**Status Check:**
- `email_verified_at IS NULL` → Not verified
- `email_verified_at IS NOT NULL` → Verified

## Configuration

### Frontend URL
File: `backend/.env`
```
FRONTEND_URL=http://localhost:5173
```

### Mail Configuration
File: `backend/.env`
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=465
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_FROM_ADDRESS=noreply@goldfleet.com
MAIL_FROM_NAME="Gold Fleet"
```

## Testing Email Verification

### 1. Using Mailtrap (Recommended for Development)
1. Create free account at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials
3. Add credentials to `.env`
4. Register a test user
5. Check inbox in Mailtrap dashboard
6. Click the verification link

### 2. Using Artisan Tinker
```bash
php artisan tinker
>>> $user = User::find(1)
>>> $user->email_verified_at = null
>>> $user->save()
>>> $user->sendEmailVerificationNotification()
```

### 3. Direct Verification (for testing)
```bash
php artisan tinker
>>> User::find(1)->markEmailAsVerified()
=> true
```

## Troubleshooting

### Issue: Email not received
**Solution:**
1. Check log file for `Email verification notification queued for sending`
2. Verify MAIL configuration in `.env`
3. Check spam/junk folder
4. Use Mailtrap to debug email sending

### Issue: Invalid verification link
**Possible causes:**
1. Hash mismatch - user's email may have been changed
2. URL corruption in email client
3. Wrong user ID in URL

**Solution:**
- Check log for `Invalid email verification hash`
- User can request new verification email via `/api/email/send-verification`

### Issue: Email already verified error
**Reason:** User tried to verify email that was already verified (expected behavior)
**Solution:** User can log in immediately without re-verification

## Security Considerations

1. **Hash Validation**: Uses SHA-256 secure hashing
2. **Signed URLs**: Optional - can be enhanced with Illuminate\Routing\Middleware\ValidateSignature
3. **Rate Limiting**: Can be added with `throttle:6,1` middleware
4. **Time-based Expiry**: 60 minutes (configurable in notification)
5. **Full Audit Trail**: All attempts logged with timestamp, IP, user agent

## Complete Email Verification Flow

```
┌─────────────┐
│   Register  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ Send Verification Email  │  ← Logged: "Email verification notification..."
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  User Clicks Link        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐     ┌─────────────────────┐
│ API: /email/verify/{id}  │────▶│ Log: Verification   │
│      /{hash}             │     │ Attempt             │
└──────┬───────────────────┘     └─────────────────────┘
       │
       ├─→ Validate hash
       │
       ├─→ Mark as verified
       │
       ├─→ Fire Verified event
       │
       ▼
┌──────────────────────────┐     ┌─────────────────────┐
│ Return Success Response  │────▶│ Log: Verification   │
│ + Set email_verified_at  │     │ SUCCESS ✓           │
└──────────────────────────┘     └─────────────────────┘
       │
       ▼
    Redirect to Login
```

## Related Files

- **Controller**: `app/Http/Controllers/Api/EmailVerificationController.php`
- **Notification**: `app/Notifications/CustomVerifyEmailNotification.php`
- **Model Method**: `app/Models/User.php::sendEmailVerificationNotification()`
- **Routes**: `routes/api.php` (lines for email verification)
- **Frontend**: `frontend/src/pages/EmailVerificationPage.jsx`
- **Logs**: `storage/logs/laravel.log`

## Summary

✅ Email verification is fully implemented with:
- Cryptographically secure hash validation
- Comprehensive logging for audit trail
- Frontend integration
- Database persistence
- API endpoints for verification and resend
- Support for development and production environments
- All verification attempts tracked in storage logs
