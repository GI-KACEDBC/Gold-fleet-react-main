# Map Dashboards - Quick Start Testing Guide

## Feature Summary

✅ **Location-Based Markers**: Trip markers use provided coordinates (origin_lat/origin_lng, destination_lat/destination_lng), NOT IP-based localization

✅ **Rotating Car Icons**: Vehicle markers display animated car SVG icons that rotate based on bearing/direction

✅ **Auto-Playing Simulations**: Approved trips automatically start simulation within 5 seconds - no manual button click needed

✅ **Alternative Map APIs**: 
- Company Dashboard: CartoDB Positron (clean, minimal)
- Driver Dashboard: USGS Topo (detailed topography)

## Testing Scenarios

### Scenario 1: Create and Auto-Start a Trip

```bash
# 1. Create a new trip with specific coordinates
POST http://localhost:8000/api/trips
{
  "vehicle_id": 1,
  "driver_id": 1,
  "origin_lat": 9.0765,
  "origin_lng": 7.3986,
  "destination_lat": 5.6037,
  "destination_lng": -0.1870,
  "start_location": "Lagos, Nigeria",
  "end_location": "Accra, Ghana"
}

# 2. Approve the trip (status changes to 'approved')
POST http://localhost:8000/api/trips/{trip_id}/approve

# 3. Within 5 seconds, simulation auto-starts
# Watch for:
# - Car icon appears at origin location
# - Car icon rotates to show direction
# - Progress bar fills from 0% to 100%
# - Speed shows as ~60 km/h (default)
```

### Scenario 2: Company Dashboard Multi-Vehicle Tracking

1. Navigate to: `http://localhost:3000/admin/maps/simulation`
2. Create 3-4 approved trips with different routes
3. Observe:
   - ✅ CartoDB maps load cleanly
   - ✅ Each vehicle shows as rotating car icon
   - ✅ Icons rotate as bearing changes
   - ✅ Progress bars update in table
   - ✅ Clicking vehicle focuses on map

### Scenario 3: Driver Dashboard Real-Time Simulation

1. Navigate to: `http://localhost:3000/driver/maps/simulation` (as driver user)
2. Trip should appear and auto-start
3. Observe:
   - ✅ USGS map loads with topography
   - ✅ Car icon shows driver's current position
   - ✅ Car rotates to show direction
   - ✅ Popup shows: speed, bearing (degrees), coordinates
   - ✅ Side panel shows progress %
   - ✅ Signal circle around vehicle position

### Scenario 4: Bearing/Direction Rotation

1. Start a trip simulation
2. Monitor for ~30 seconds as simulation progresses
3. Observe:
   - ✅ Car icon rotates smoothly (0.3s transitions)
   - ✅ Icon points toward destination
   - ✅ Heading updates in popup as bearing changes
   - ✅ No jumps or jerky movements

### Scenario 5: Completion and Cleanup

1. Let simulation run to 100% completion
2. Observe:
   - ✅ Vehicle marker moves to exact destination coordinates
   - ✅ Simulation automatically stops
   - ✅ Trip status changes to 'completed'
   - ✅ Vehicle marker disappears from active list

## Key Coordinates for Testing

### Nigeria-Ghana Route (Good for testing)
- **Origin**: Lagos, Nigeria
  - Lat: 6.5244
  - Lng: 3.3792
- **Destination**: Accra, Ghana
  - Lat: 5.6037
  - Lng: -0.1870
- Distance: ~200 km, ~3-4 hour drive

### Lagos Metro Simulations
- West: Lat 6.4969, Lng 3.2648
- East: Lat 6.5521, Lng 3.3521
- North: Lat 6.6521, Lng 3.3521
- South: Lat 6.4521, Lng 3.3521

## Monitoring the Auto-Start Feature

### Company Dashboard (Auto-Start)
1. Create trip with status 'pending'
2. Approve trip (status → 'approved')
3. **Expected**: Within 5 seconds, status auto-updates to 'active' and car moves
4. **If not happening**: Check browser console for errors

### Driver Dashboard (Auto-Start)
1. Assign trip to driver (status 'pending')
2. Approve trip (status → 'approved')
3. **Expected**: Within 5 seconds, "Approve & Start" button disappears and car moves
4. **If not happening**: 
   - Verify user is logged in as driver
   - Check backend logs for simulation start errors

## Visual Verification Checklist

### Map Tiles
- [ ] Company Dashboard shows CartoDB (lighter, street-style background)
- [ ] Driver Dashboard shows USGS (topographic features visible)
- [ ] Maps load without errors
- [ ] Zoom and pan work smoothly

### Car Icons
- [ ] Car is SVG (not emoji, not raster)
- [ ] Car shows: body, roof, windows, headlights, direction arrow
- [ ] Car rotates smoothly when bearing changes
- [ ] Car is centered on its position (not offset)
- [ ] Car color matches status (green for active)

### Markers
- [ ] Green origin marker (📍) at trip start
- [ ] Red destination marker (🎯) at trip end
- [ ] Progress circle around vehicle (faint)
- [ ] All coordinates are correct (not shifted)

### Information Display
- [ ] Popup shows: name, driver, status, progress, speed, direction, lat/lng
- [ ] Progress bar fills smoothly
- [ ] Speed displays accurately (~60 km/h for default simulation)
- [ ] Direction shows degrees (0-360)

## Troubleshooting

### Issue: Car icon shows emoji instead of SVG
**Solution**: 
- Clear browser cache
- Check browser console for JavaScript errors
- Verify mapIcons.js imports correctly

### Issue: Car doesn't rotate
**Solution**:
- Check backend simulator is calculating bearing
- Verify simulation.heading is not undefined
- Monitor API response in Network tab

### Issue: Auto-start not working
**Solution**:
- Check trip status is exactly 'approved' (not 'Approved')
- Verify approveTrip() API endpoint is working
- Check browser console for API errors
- Refresh page to trigger fetch

### Issue: Wrong tile provider showing
**Solution**:
- Hard refresh (Ctrl+F5 / Cmd+Shift+R)
- Clear browser cache
- Verify TileLayer URL is correct in code

### Issue: Simulation doesn't move
**Solution**:
- Verify backend simulator.js is running
- Check API /trips{id}/simulation endpoint
- Monitor Network tab for location updates
- Verify polling interval (should be 3-5 seconds)

## Performance Testing

### Acceptable Performance
- Map loads: < 2 seconds
- Car updates position: every 3 seconds
- Icon rotates: smooth, no stutter
- Popup opens: < 300ms
- Multiple vehicles: < 500ms update

### Load Testing (Multiple Vehicles)
```bash
# Create 10 active trips
for i in {1..10}; do
  # Create and approve trip
done

# Monitor:
# - Map still responsive
# - No memory leaks
# - Updates still smooth
# - Browser tab CPU usage reasonable
```

## API Verification

### Endpoints Used by New Features
```
GET  /api/trips/active           - Fetch all active trips (company)
GET  /api/trips/driver/assigned  - Fetch driver's assigned trip
POST /api/trips/{id}/approve     - Approve trip and start simulation
GET  /api/trips/{id}/locations   - Get trip locations including simulation
POST /api/vehicle/location       - Update vehicle location (backend simulator)
```

### Sample Response (Trip with Simulation)
```json
{
  "id": 42,
  "status": "active",
  "origin": {
    "latitude": 9.0765,
    "longitude": 7.3986,
    "name": "Lagos Terminal"
  },
  "destination": {
    "latitude": 5.6037,
    "longitude": -0.1870,
    "name": "Accra Terminal"
  },
  "simulation": {
    "is_active": true,
    "current_lat": 8.5402,
    "current_lng": 5.1234,
    "speed_kmh": 60,
    "heading": 225,
    "progress_percentage": 45.5
  }
}
```

## Success Criteria

✅ All of the following should be true:

1. **Coordinates**: Trip markers placed at exact origin/destination coordinates provided in trip data
2. **Car Icon**: Visible SVG car showing at current vehicle position
3. **Rotation**: Car rotates smoothly based on bearing (0-360 degrees)
4. **Auto-Start**: Approved trips start simulation without user action
5. **Company Map**: Uses CartoDB tiles
6. **Driver Map**: Uses USGS tiles
7. **Animation**: Smooth 0.3s transitions when rotating
8. **Popups**: Show direction in degrees and current coordinates
9. **Progress**: Updates in real-time (3-5 second intervals)
10. **Completion**: Simulation stops at 100% and vehicle moves to destination

## Dashboard URLs

```
# Company Dashboard (Multi-vehicle tracking)
http://localhost:3000/admin/maps/simulation
http://localhost:3000/dashboard/maps/simulation

# Driver Dashboard (Single trip tracking)
http://localhost:3000/driver/maps/simulation
http://localhost:3000/driver/dashboard/maps/simulation
```

## Next Steps (Optional Enhancements)

- [ ] Add route optimization (show actual roads, not straight line)
- [ ] Display ETA based on current speed and remaining distance
- [ ] Add traffic layer integration
- [ ] Allow custom simulation speeds
- [ ] Support multi-stop routes
- [ ] Add offline map tile caching
- [ ] Mobile-responsive dashboard
- [ ] Real GPS fallback mode
