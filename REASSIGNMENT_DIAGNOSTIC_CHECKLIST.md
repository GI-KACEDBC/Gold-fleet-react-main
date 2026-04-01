# Vehicle Reassignment Workflow - Diagnostic Checklist

## This checklist helps verify each step of the admin vehicle reassignment workflow.

---

## STEP 1: Admin Views Issue Details
**Location:** Admin Dashboard → Issues → Click on a Vehicle Issue

**What to verify:**
- [ ] Issue page loads with vehicle details
- [ ] Issue has a vehicle_id field populated
- [ ] "Assign Vehicle" button is visible

**Console logs to check:**
- Issue ID and vehicle_id should be clearly visible

**If failed:**
- Check that issue has `vehicle_id` field set
- Verify issue creation endpoint is capturing vehicle_id

---

## STEP 2: Admin Clicks "Assign Vehicle" Button
**Location:** IssueDetail page → "Assign Vehicle" button

**Browser console should show:**
```
📥 Trip ID confirmation
  Old Vehicle ID: XXX
  New Vehicle ID: YYY

✅ Trip ID confirmed: {tripId}
  (or: ⚠️ No trip_id found - reassignment will still work but trip may not update)

📤 Sending update request to server:
   URL: PUT /api/trips/{tripId}
   Payload: {vehicle_id: YYY}
```

**What to verify:**
- [ ] Trip ID is found (non-null)
- [ ] Update request is being sent to correct trip ID
- [ ] Vehicle ID in payload is correct new vehicle

**If Trip ID is null:**
- Issue may not have `driver_id` or `vehicle_id` fields
- Original trip creation may not have captured these fields
- Check database: SELECT * FROM issues WHERE id = {issueId}

---

## STEP 3: Backend Receives Update Request
**Verify the API actually updates the database:**

**Option A - Server logs:**
- Check backend console for `PUT /api/trips/{tripId}` request
- Verify request body has `vehicle_id: NEW_VEHICLE_ID`

**Option B - Database query:**
```sql
SELECT id, vehicle_id, status FROM trips WHERE id = {tripId};
```
- [ ] vehicle_id should equal NEW_VEHICLE_ID after update
- [ ] If still shows old vehicle_id, update endpoint isn't working

**If database not updated:**
- Trip update endpoint may be failing silently
- Check backend route: `PUT /api/trips/:id`
- Verify database connection is working

---

## STEP 4: Frontend Gets Update Confirmation
**Browser console should show:**
```
📥 Full response: {data: {id: tripId, vehicle_id: YYY, ...}}

📥 Update response received:
   trip_id: {tripId}
   vehicle_id: YYY
   vehicle: {make: "...", model: "...", ...}

✅ Trip update VERIFIED - vehicle_id now: YYY
```

**What to verify:**
- [ ] Response includes updated vehicle_id
- [ ] Response vehicle_id matches new vehicle ID
- [ ] No error about "Trip vehicle update failed"

**If verification fails:**
- Database wasn't updated (check Step 3)
- Backend isn't returning updated vehicle_id
- Network error occurred

---

## STEP 5: Reassignment Stored in localStorage
**Browser console should show:**
```
💾 Storing reassignment in localStorage:
   Key: vehicleReassignments
   Value: {
     tripId: XXX,
     oldVehicleId: YYY,
     newVehicleId: ZZZ,
     newVehicle: {make, model, license_plate},
     timestamp: ISO_DATE
   }

✅ Reassignment stored. Total reassignments: N
```

**Verify in browser DevTools:**
1. Open DevTools (F12) → Application → LocalStorage
2. Find key: `vehicleReassignments`
3. Value should be an array like:
```json
[
  {
    "tripId": "123",
    "oldVehicleId": "45",
    "newVehicleId": "67",
    "newVehicle": {
      "id": "67",
      "make": "Toyota",
      "model": "Hilux",
      "license_plate": "ABC-123"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

**What to verify:**
- [ ] tripId is present and not null
- [ ] newVehicleId matches new vehicle
- [ ] localStorage key exists and has data

---

## STEP 6: Reassignment Log Created
**Browser console should show:**
```
✅ Reassignment log created: {logIssueId}
```

**Verify in database:**
```sql
SELECT * FROM issues 
WHERE category = 'admin_reassignment' 
  AND trip_id = {tripId}
ORDER BY created_at DESC LIMIT 1;
```

**What to verify:**
- [ ] Log issue exists with trip_id
- [ ] Log issue references new vehicle_id
- [ ] Log issue name includes vehicle details

---

## STEP 7: Driver Loads Dashboard (Most Critical Step)
**Driver refreshes page or navigates to dashboard**

**Browser console should show:**
```
📥 Trips fetched from API: [
  {id: 123, vehicle_id: ZZZ, vehicle: {make, model, ...}, status: "..."}
]

🚗 Enriched trips with vehicles: [
  {id: 123, vehicle_id: ZZZ, vehicle: "Toyota Hilux", status: "..."}
]

📋 Checking reassignments from storage: [
  {tripId: 123, newVehicleId: ZZZ, ...}
]

Trip 123: Vehicle reassigned to Toyota Hilux
✅ Notification queued for Trip 123

🚗 Marking trip 123 as reassigned (API vehicle: Toyota Hilux)

📢 Showing notification for reassignment
   Trip data from API: {id: ZZZ, make: "Toyota", model: "Hilux", license_plate: "ABC-123"}
```

**CRITICAL CHECKS:**
- [ ] Trip fetched from API with NEW vehicle_id (ZZZ, not old vehicle)
- [ ] Enriched trip shows NEW vehicle make/model
- [ ] Reassignment detected from localStorage
- [ ] Trip marked as reassigned

**If enrichment shows OLD vehicle:**
- API is returning old vehicle_id
- Check: Is backend trip update actually persisting?
- Run database query from Step 3

---

## STEP 8: Driver Sees Green Notification Banner
**On DriverDashboard page:**

**Yellow/Green Banner should show:**
```
✅ New vehicle assigned!
Toyota Hilux (ABC-123) is ready
Please complete a new inspection before proceeding
[Do Inspection Now]
```

**What to verify:**
- [ ] Banner is visible
- [ ] Shows CORRECT new vehicle (not old vehicle)
- [ ] "Do Inspection Now" button works

**If banner shows old vehicle:**
- Step 7 enrichment failed
- Vehicle data coming from older trip response
- Need to verify API trip response

---

## STEP 9: Driver Clicks "Do Inspection Now"
**Browser should navigate to:**
```
/driver/maintenance?tripId={tripId}&vehicleId={newVehicleId}
```

**Or check in URL:**
- tripId parameter should match trip ID
- vehicleId should be NEW vehicle ID

**What to verify:**
- [ ] Navigation works
- [ ] Correct trip ID in URL
- [ ] Correct vehicle ID in URL

---

## STEP 10: Driver Completes Inspection on New Vehicle
**On Maintenance Checklist page:**

**What should happen:**
- [ ] Checklist loads for new vehicle
- [ ] Image upload works
- [ ] Submit passes (no issues with new vehicle)
- [ ] Success modal shows
- [ ] "Start Trip" button becomes available

---

## STEP 11: Trip Shows Reassigned Vehicle
**Back on Driver Dashboard:**

**Trip card should show:**
```
🔄 Reassigned     (blue badge)

🚗 Toyota Hilux (ABC-123)   (blue text, marked NEW)
```

**What to verify:**
- [ ] "🔄 Reassigned" badge visible
- [ ] Vehicle shows NEW vehicle, not old
- [ ] Vehicle name/plate is correct

---

## Troubleshooting Flowchart

**Problem: Trip ID is null**
→ Check issue has driver_id and vehicle_id fields
→ Verify trip exists with matching driver_id + vehicle_id
→ Check trip discovery logic runs (search /api/trips)

**Problem: API returns old vehicle_id after update**
→ Backend trip update endpoint not working
→ Check database directly: SELECT * FROM trips WHERE id = X
→ Check backend PUT /api/trips/:id route

**Problem: Frontend shows old vehicle even after database updated**
→ API is not returning updated trip data
→ Frontend not re-fetching trips after reassignment
→ Check: Does api.getTrips() include latest vehicle_id?

**Problem: Driver doesn't see green notification banner**
→ Reassignment not stored in localStorage
→ Trip ID mismatch between reassignment and fetched trips
→ Check DevTools LocalStorage > vehicleReassignments

**Problem: Enrichment logs show correct vehicle but trip card shows old vehicle**
→ Trip object not being updated in React state
→ Check setAssignedTrips() call with enriched data
→ Verify map function uses updated trip object

---

## Quick Debug Commands

In browser DevTools console:
```javascript
// Check localStorage reassignments
JSON.parse(localStorage.getItem('vehicleReassignments'))

// Check current trips in state (requires state inspection)
// (would need to add console.log to React component)

// Query API directly
api.getTrips().then(r => console.log(r.data))

// Clear reassignments to start fresh
localStorage.removeItem('vehicleReassignments')
localStorage.removeItem(/reassignment-notified-/)
```

---

## After Each Step

**Record your findings:**
- [ ] Step X: Working / Failed (explain why)
- [ ] Console shows expected logs: YES / NO
- [ ] Database has correct data: YES / NO / UNKNOWN

Use this information to narrow down where the issue is occurring.
