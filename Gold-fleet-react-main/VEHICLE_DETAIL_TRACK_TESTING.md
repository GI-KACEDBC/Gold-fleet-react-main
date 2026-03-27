# Vehicle Detail Page - Track Button Testing Guide

## Implementation Summary
✅ Track button has been successfully added to the **Vehicle Detail page** (`/vehicles/:id`)

### What Was Added
- **Track Button** in the header next to Back, Edit, and Delete buttons
- **Helper Function**: `canTrackVehicle()` - checks if vehicle is active AND assigned to a driver
- **Handler Function**: `handleCheckLocation()` - navigates to map with the vehicle pre-selected
- **Button Styling**: 
  - **Enabled (Green)**: Active vehicle with assigned driver
  - **Disabled (Gray)**: Inactive or unassigned vehicle
  - **Hover Tooltip**: Shows why button is disabled if not enabled

---

## Manual Testing Steps

### Test 1: View Track Button on Vehicle Detail Page
1. Navigate to: `http://localhost:5174/vehicles/20` (or any vehicle ID)
2. **Expected**: You should see Track button in the header between Back and Edit buttons
3. **Button Order**: Back → Track → Edit → Delete

### Test 2: Track Button with Active + Assigned Vehicle
**Prerequisites**: Find a vehicle that is:
- Status: `active`
- Has an assigned driver (marked as assigned in the system)

**Steps**:
1. Navigate to that vehicle's detail page
2. Look at the Track button
3. **Expected Result**:
   - Button text is GREEN (`text-green-600`)
   - Button is ENABLED (not grayed out)
   - Hovering shows tooltip: "View vehicle location"
   - Button is clickable

4. Click the Track button
5. **Expected Result**: 
   - Navigates to map page (`/map?vehicleId={id}`)
   - Vehicle should be auto-selected on the map
   - Map centers on the vehicle location

### Test 3: Track Button with Inactive/Unassigned Vehicle
**Prerequisites**: Find a vehicle that is:
- Status: `inactive` OR `maintenance`
- OR no assigned driver

**Steps**:
1. Navigate to that vehicle's detail page
2. Look at the Track button
3. **Expected Result**:
   - Button text is GRAY (`text-gray-400`)
   - Button is DISABLED (not clickable)
   - Cursor shows `cursor-not-allowed`
   - Hovering shows tooltip: "Vehicle must be active and assigned to a driver"

4. Try to click the button
5. **Expected Result**: Nothing happens (button is disabled)

### Test 4: Navigation Back from Map
1. Click Track button on any enabled vehicle
2. Should navigate to `/map?vehicleId={id}`
3. Vehicle should auto-select on the map
4. Click Back button or navigate to another vehicle
5. Check that map state is properly maintained

---

## Verification Checklist

| Test Case | Expected | Status |
|-----------|----------|--------|
| Track button visible on detail page | Yes | ☐ |
| Button layout: Back → Track → Edit → Delete | Correct order | ☐ |
| Active + Assigned vehicle button | Green, enabled, clickable | ☐ |
| Inactive/Unassigned vehicle button | Gray, disabled, not clickable | ☐ |
| Click Track navigates to map | URL changes to /map?vehicleId={id} | ☐ |
| Vehicle auto-selects on map | Vehicle highlighted/selected | ☐ |
| Button styling matches existing buttons | Consistent with other buttons | ☐ |
| Hover tooltip shows | Appropriate message displays | ☐ |
| No console errors | F12 dev tools show no errors | ☐ |

---

## Code Changes Made

### File: `frontend/src/pages/VehicleDetail.jsx`

#### Added Functions:
```javascript
const canTrackVehicle = (vehicle) => {
  return vehicle.status === 'active' && (vehicle.assigned_driver_id || vehicle.driver);
};

const handleCheckLocation = () => {
  navigate(`/map?vehicleId=${vehicle.id}`);
};
```

#### Added Button in Header:
```jsx
<button
  onClick={handleCheckLocation}
  disabled={!canTrackVehicle(vehicle)}
  className={`px-4 py-2 border border-gray-300 rounded-lg transition-colors font-medium ${
    canTrackVehicle(vehicle)
      ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
      : 'text-gray-400 cursor-not-allowed'
  }`}
  title={canTrackVehicle(vehicle) ? 'View vehicle location' : 'Vehicle must be active and assigned to a driver'}
>
  Track
</button>
```

---

## Locations Where Track Button Now Appears
✅ **Vehicles List Page** (`/vehicles`) - Table rows, Actions column
✅ **Vehicle Detail Page** (`/vehicles/:id`) - Header section
✅ **Map Page** (`/map`) - Auto-selects vehicle from URL parameter

---

## Troubleshooting

### Issue: Button not visible
- Refresh the page (Ctrl+F5)
- Check that vehicle exists
- Verify frontend dev server is running

### Issue: Button always disabled
- Verify vehicle has `active` status
- Confirm vehicle is assigned to a driver
- Check vehicle data in API response

### Issue: Navigation to map fails
- Ensure map page route exists (`/map`)
- Check MapDashboard.jsx has URL parameter support
- Verify vehicle ID is correct

### Issue: Console errors
- Check browser developer console (F12)
- Look for import errors or syntax issues
- Verify all functions are defined

---

## Feature Status: ✅ COMPLETE
- Implementation: Done
- Testing: In Progress
- Documentation: Complete

All code changes are backward-compatible and non-breaking.
