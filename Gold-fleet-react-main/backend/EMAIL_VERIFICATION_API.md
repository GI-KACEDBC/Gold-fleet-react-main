# Email Verification API - Quick Summary

## New System: API-First Email Verification

**Email verification is now required at login time.**

### Login Flow

#### Step 1: User Tries to Login
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST `
  -Body '{"email":"driver@test.com","password":"password123"}' `
  -Headers @{"Content-Type"="application/json"}
```

#### Step 2: If Email NOT Verified
Response:
```json
{
  "success": false,
  "message": "Please verify your email before logging in",
  "code": "EMAIL_NOT_VERIFIED",
  "user_id": 1,
  "api_endpoint": "/api/dev/email/user/1/status"
}
```

#### Step 3: Verify Email (Choose One Method)

**Option A: Quick API Verification (Fastest)**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/email/quick-verify" -Method POST `
  -Body '{"user_id":1}' `
  -Headers @{"Content-Type"="application/json"}
```

**Option B: Get Link from API**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/user/1/status"
```

Copy `verification_link` and open in browser.

**Option C: Check Logs**
```powershell
Get-Content -Path "backend/storage/logs/laravel.log" -Tail 50 | Select-String "CLICK LINK"
```

Look for:
```
🔗 CLICK LINK TO VERIFY EMAIL:
http://localhost:5173/email/verify?id=1&hash=abc123...
```

**Option D: Force Verify (Development Only)**
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/dev/email/user/1/force-verify" -Method POST
```

#### Step 4: Login Now Works!
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST `
  -Body '{"email":"driver@test.com","password":"password123"}' `
  -Headers @{"Content-Type"="application/json"}
```

Success:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "abc123...",
  "user": {
    "id": 1,
    "email": "driver@test.com",
    "email_verified": true
  }
}
```

---

## Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/login` | POST | Login (checks email verification) |
| `/api/email/quick-verify` | POST | Verify email via API |
| `/api/dev/email/user/{id}/status` | GET | Get verification link |
| `/api/dev/email/user/{id}/force-verify` | POST | Force verify (dev only) |

---

## Log Messages to Look For

**When Verification Sent:**
```
═══════════════════════════════════════════════════════════════
📧 EMAIL VERIFICATION LINK - DEVELOPMENT MODE
═══════════════════════════════════════════════════════════════
User: John Doe (john@example.com)
🔗 CLICK LINK TO VERIFY EMAIL:
http://localhost:5173/email/verify?id=1&hash=abc123...
═══════════════════════════════════════════════════════════════
```

**When Email is Verified:**
```
✓ EMAIL VERIFIED VIA API - USER CAN NOW LOGIN
  user_id: 1
  user_name: John Doe
  email: john@example.com
  verified_at: 2026-03-24T10:30:15Z
```

---

## Complete Test Script

```powershell
# 1. Register driver
$registerResponse = Invoke-WebRequest -Uri "http://localhost:8000/api/driver-register" -Method POST `
  -Body '{"name":"Test Driver","email":"test@example.com","password":"password123","password_confirmation":"password123","access_code":"CODE123"}' `
  -Headers @{"Content-Type"="application/json"}
$data = $registerResponse.Content | ConvertFrom-Json
$userId = $data.driver.user_id

# 2. Try to login (should fail - email not verified)
Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST `
  -Body '{"email":"test@example.com","password":"password123"}' `
  -Headers @{"Content-Type"="application/json"}
# Response: EMAIL_NOT_VERIFIED

# 3. Verify email via API
Invoke-WebRequest -Uri "http://localhost:8000/api/email/quick-verify" -Method POST `
  -Body "{`"user_id`":$userId}" `
  -Headers @{"Content-Type"="application/json"}
# Response: Email verified successfully!

# 4. Login now works
Invoke-WebRequest -Uri "http://localhost:8000/api/login" -Method POST `
  -Body '{"email":"test@example.com","password":"password123"}' `
  -Headers @{"Content-Type"="application/json"}
# Response: Success with token!
```

---

## Features

✅ **Email verification required at login time**
✅ **API-based verification (no email link needed in development)**
✅ **Verification links shown in logs**
✅ **Quick verify endpoint for testing**
✅ **Force verify for development**
✅ **Full audit trail in logs**
✅ **Clear error messages**

---

## No Email Link in Logs?

The verification link IS shown in logs when you:
1. Register a new user
2. Call `/api/dev/email/user/{id}/resend`  
3. Register via `/api/driver-register`

Look for the marker: `CLICK LINK TO VERIFY EMAIL`

If not seeing logs, check:
- `backend/storage/logs/laravel.log` file exists
- `.env` is set to `APP_ENV=local` or `development`
- Backend is running

---

## Summary

✨ **New Flow:**
1. User tries to login
2. Gets error: "Email not verified"
3. Uses API to verify: `POST /api/email/quick-verify`
4. Logs in successfully

No email client needed in development! Everything works through API calls.
