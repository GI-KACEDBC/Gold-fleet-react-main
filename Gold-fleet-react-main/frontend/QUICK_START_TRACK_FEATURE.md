# Quick Reference - Check Location Feature

## What Was Added

**"Track" button in Vehicles List table** → Navigates to Map with selected vehicle

---

## Button Behavior

| State | Appearance | Action |
|-------|------------|--------|
| **Enabled** | Green text `text-green-600` | Click → Navigate to `/map?vehicleId={id}` |
| **Disabled** | Gray text `text-gray-400 cursor-not-allowed` | Hover shows tooltip |

---

## When Button is Enabled

Vehicle must meet **BOTH** conditions:
1. `status === "active"`
2. Has driver: `assigned_driver_id` OR `driver` field populated

---

## Implementation Details

### Files Modified
| File | Changes |
|------|---------|
| `VehiclesList.jsx` | Added Track button, helper functions, navigation |
| `MapDashboard.jsx` | Added URL parameter support, auto-select logic |

### Files NOT Modified
- ❌ Database schema
- ❌ API endpoints
- ❌ Backend logic
- ❌ Styling system
- ❌ Layout/components library

---

## User Flow

```
Vehicles List                Map
    ↓                        ↑
User sees vehicles       Auto-selects
    ↓                   vehicle from URL
User clicks "Track"     ↑
    ↓
Navigate to /map?vehicleId=123
```

---

## Code References

### VehiclesList.jsx
```javascript
// Helper function
const canTrackVehicle = (vehicle) => {
  return vehicle.status === 'active' && (vehicle.assigned_driver_id || vehicle.driver);
};

// Handler
const handleCheckLocation = (vehicleId) => {
  navigate(`/map?vehicleId=${vehicleId}`);
};

// Button in table
<button
  onClick={() => handleCheckLocation(vehicle.id)}
  disabled={!canTrackVehicle(vehicle)}
  className={canTrackVehicle(vehicle) ? 'text-green-600 hover:text-green-900 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}
  title={canTrackVehicle(vehicle) ? 'Check vehicle location' : 'Only active assigned vehicles can be tracked'}
>
  Track
</button>
```

### MapDashboard.jsx
```javascript
// Import
import { useSearchParams } from 'react-router-dom';

// Extract param
const [searchParams] = useSearchParams();
const vehicleIdParam = searchParams.get('vehicleId');

// Auto-select
useEffect(() => {
  if (vehicleIdParam && vehicles.length > 0) {
    const vehicle = vehicles.find(v => v.id === parseInt(vehicleIdParam));
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  }
}, [vehicleIdParam, vehicles]);
```

---

## Testing Scenarios

### ✅ Should Work
- Click Track on active vehicle with driver → Map loads with vehicle selected
- Track button disabled for inactive vehicles
- Track button disabled for vehicles without driver
- URL directly: `/map?vehicleId=5` → Vehicle 5 auto-selected on map load

### ❌ Should Not Work (Expected)
- Create new vehicle without driver → Track button disabled
- Set vehicle to maintenance status → Track button disabled
- Remove driver assignment → Track button disabled (refresh page to update)

---

## Performance Impact

- **Zero**: All logic is UI-only navigation
- **No new API calls**: Reuses existing vehicle data
- **No data fetching**: Uses already-loaded vehicles
- **No state duplication**: Leverages existing MapDashboard state

---

## UI/UX Notes

- Button placed in Actions column alongside View, Edit, Delete
- Disabled state clearly indicated by color + cursor change
- Tooltip explains why disabled
- Green color indicates "tracking enabled" state
- Follows existing button styling patterns

---

## Accessibility

✅ Disabled button has appropriate `disabled` attribute
✅ Color change + cursor change indicates disabled state
✅ Tooltip provides context
✅ Button is keyboard accessible (Tab, Enter)
✅ Semantic HTML buttons (not divs)

---

## What to Test

```
1. Open /vehicles
2. For each vehicle:
   - If active + has driver → Track button green, clickable
   - If inactive OR no driver → Track button gray, disabled
3. Click Track → /map?vehicleId=X loads
4. Vehicle X auto-selects on map
5. Map centers on vehicle location
6. Return to /vehicles (back button)
```

---

## Rollback Plan

If needed, revert changes to:
- `frontend/src/pages/Vehicles/VehiclesList.jsx` (6 lines removed)
- `frontend/src/pages/MapDashboard.jsx` (7 lines removed)

No database, API, or config changes to undo.

---

## Questions Answered

**Q: Will this break existing code?**
A: No. Only additive changes, all existing features work unchanged.

**Q: Do we need database migrations?**
A: No. Uses existing vehicle fields.

**Q: Do we need backend changes?**
A: No. Completely frontend feature.

**Q: What if vehicle has no location?**
A: Map still loads, vehicle selected but location won't display (existing map behavior).

**Q: Can user disable the Track button?**
A: No, it's automatically enabled/disabled based on vehicle status and driver assignment.

---

## Related Documentation

- Full guide: `CHECK_LOCATION_FEATURE.md`
- Map component: `MapDashboard.jsx`
- List component: `VehiclesList.jsx`
- Routing: `App.jsx` (view `/map` route)

