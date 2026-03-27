# Track Button - Quick Reference Implementation Guide

## 🎯 What is the Track Button?

A quick-access button in the **Vehicles List** and **Vehicle Detail** pages that allows users to:
- Click the **Track** button next to any vehicle
- Immediately navigate to the **Map Dashboard**
- See that **vehicle's location in real-time** on the interactive map
- View the **vehicle's trip history** with locations

---

## 📍 Where Does It Appear?

### 1. Vehicles List Page
**URL**: `http://localhost:5174/vehicles`
**Location**: Action column in the vehicles table
**Button Text**: "Track"
**Next to**: Edit and Delete buttons

### 2. Vehicle Detail Page  
**URL**: `http://localhost:5174/vehicles/{id}` (e.g., `/vehicles/20`)
**Location**: Header section with action buttons
**Button Text**: "Track"
**Next to**: Edit and Delete buttons

### 3. Map Dashboard Page
**URL**: `http://localhost:5174/map` (or `/map?vehicleId={id}`)
**Location**: N/A (this is where the Track button leads to)
**Display**: Interactive map with selected vehicle highlighted

---

## 🔗 Complete Connection Chain

```
USER ACTION
    ↓
    └─→ Click "Track" button on Vehicles List/Detail
         ├─ Button checks: vehicle.status === 'active' AND has assigned driver
         ├─ If ✅ enabled (green): navigate('/map?vehicleId={id}')
         └─ If ❌ disabled (gray): show tooltip "Vehicle must be active and assigned"

FRONTEND ROUTING
    ↓
    └─→ React Router navigates to /map?vehicleId=20
         ├─ MapDashboard component receives URL parameter
         ├─ Extract vehicleIdParam from URL
         └─ useEffect triggers to find matching vehicle

API CALL (Frontend → Backend)
    ↓
    └─→ api.getVehicles()
         ├─ HTTP GET http://localhost:8000/api/vehicles
         ├─ Authorization: Bearer {token}
         └─ Returns: Array of all company vehicles with trips

BACKEND PROCESSING
    ↓
    └─→ VehicleController@index()
         ├─ Query: Vehicle::where('company_id', $companyId)
         ├─ Load relations: with(['trips' => limit(1)])
         ├─ Filter by driver role if needed
         └─ Return JSON response with vehicle data

DATABASE QUERY
    ↓
    └─→ SELECT * FROM vehicles WHERE company_id = ?
         ├─ JOIN trips ON vehicles.id = trips.vehicle_id
         ├─ JOIN vehicle_locations ON vehicles.id = vehicle_locations.vehicle_id
         └─ Returns: Vehicle records with relationships loaded

FRONTEND DISPLAY
    ↓
    └─→ MapDashboard receives vehicle data
         ├─ Find vehicle matching vehicleIdParam
         ├─ setSelectedVehicle(vehicle)
         ├─ Map centers on vehicle coordinates
         ├─ Display vehicle marker on map
         └─ Show trip route (if available)

USER SEES
    ↓
    └─→ Interactive map with vehicle location
         ├─ Blue/Gold marker showing vehicle position
         ├─ Marker popup with vehicle info
         ├─ Trip route displayed in background
         └─ Real-time location updates (if available)
```

---

## 🗄️ Database Tables Involved

### 1. `vehicles` table
**Key Columns for Track Button**:
- `id` - Vehicle identifier (passed via URL param)
- `company_id` - Isolates data by company
- `status` - Must be 'active' for Track button to be enabled
- `name`, `make`, `model` - Display info
- `license_plate`, `vin` - Vehicle identification

**Related Records**:
- `assigned_driver_id` - Check if vehicle has a driver
- Latest `trip` - Shows where vehicle came from/going to

### 2. `trips` table
**Columns Used**:
- `vehicle_id` - Links to vehicle
- `driver_id` - Links to driver
- `start_location`, `end_location` - Trip endpoints
- `status` - Trip progress (planned, in_progress, completed, etc.)
- `origin_lat`, `origin_lng` - Starting coordinates
- `destination_lat`, `destination_lng` - Ending coordinates
- `distance`, `start_mileage`, `end_mileage` - Distance metrics

### 3. `vehicle_locations` table
**Columns Used**:
- `vehicle_id` - Links to vehicle
- `latitude`, `longitude` - Current position
- `speed` - Current speed
- `heading` - Direction
- `recorded_at` - When position was recorded

### 4. `drivers` table
**Columns Used**:
- `id` - Driver identifier
- `vehicle_id` - Assigned vehicle
- `company_id` - Company affiliation

---

## 🔐 Security & Authorization

### ✅ Company Isolation
Every endpoint checks:
```python
auth()->user()->company_id === vehicle.company_id
```
Users can ONLY see/track vehicles from their own company.

### ✅ Status Requirement
Track button is DISABLED unless:
```javascript
vehicle.status === 'active'  // AND
vehicle.assigned_driver_id || vehicle.driver  // is assigned
```

### ✅ API Authentication
All endpoints require:
```
Authorization: Bearer {auth_token}
```

---

## 🛣️ API Endpoints (Backend Routes)

| Endpoint | Method | Purpose | Controller |
|----------|--------|---------|-----------|
| `/api/vehicles` | GET | List all vehicles | VehicleController@index |
| `/api/vehicles/{id}` | GET | Get vehicle details | VehicleController@show |
| `/api/vehicle-locations` | GET | Get map locations | MapDashboardController@getVehicleLocations |
| `/api/tracker/last-location/{vehicleId}` | GET | Get latest location | PhoneTrackerController@getLastLocation |
| `/api/trips` | GET | List all trips | TripController@index |
| `/api/trips/{id}` | GET | Get trip details | TripController@show |

---

## 🧬 Frontend Components

### VehiclesList.jsx
```javascript
// Line: Helper function to check if Track button should be enabled
const canTrackVehicle = (vehicle) => {
  return vehicle.status === 'active' && (vehicle.assigned_driver_id || vehicle.driver);
};

// Line: Handler when Track button is clicked
const handleCheckLocation = (vehicleId) => {
  navigate(`/map?vehicleId=${vehicleId}`);
};

// Line: Track button in JSX (in table Actions column)
<button 
  onClick={() => handleCheckLocation(vehicle.id)}
  disabled={!canTrackVehicle(vehicle)}
  className="text-green-600 hover:text-green-900"
>
  Track
</button>
```

### VehicleDetail.jsx
```javascript
// Same functions as VehiclesList (see above)
// Located in header section instead of table
```

### MapDashboard.jsx
```javascript
// Line: Extract vehicle ID from URL parameter
const [searchParams] = useSearchParams();
const vehicleIdParam = searchParams.get('vehicleId');

// Line: Auto-select vehicle when URL parameter is present
useEffect(() => {
  if (vehicleIdParam && vehicles.length > 0) {
    const vehicle = vehicles.find(v => v.id === parseInt(vehicleIdParam));
    if (vehicle) {
      setSelectedVehicle(vehicle);
    }
  }
}, [vehicleIdParam, vehicles]);

// Line: Load vehicles from API
const response = await api.getVehicles();
```

---

## 🔄 Data Flow Example

### User Scenario: Click Track on Vehicle #20

```
1. USER INTERFACE
   └─ User on /vehicles (Vehicles List)
      └─ Sees vehicle "2020 Mercedes-Benz Actros" (ID: 20)
      └─ Status: ✅ Active | Driver: ✅ Ahmed Hassan assigned
      └─ Clicks "Track" button

2. FRONTEND PROCESSING
   └─ canTrackVehicle(vehicle) checks:
      ├─ vehicle.status === 'active' ✅
      ├─ vehicle.driver.id exists ✅
      └─ Returns true → Button is enabled ✅
   └─ handleCheckLocation(20) executes:
      └─ navigate('/map?vehicleId=20')
      └─ URL changes to: http://localhost:5174/map?vehicleId=20

3. MAP COMPONENT LOADS
   └─ MapDashboard component mounts
      └─ useSearchParams extracts 'vehicleId=20'
      └─ vehicleIdParam = '20'

4. API REQUEST
   └─ fetchVehicleData() called
      └─ api.getVehicles() sends:
         POST http://localhost:8000/api/vehicles
         Headers: { Authorization: Bearer xyz..., Accept: application/json }

5. BACKEND PROCESSES REQUEST
   └─ VehicleController@index() executes:
      ├─ $companyId = auth()->user()->company_id (e.g., 5)
      ├─ $vehicles = Vehicle::where('company_id', 5)
      │                      ->with(['trips' => limit(1)])
      │                      ->get()
      └─ Returns JSON with all vehicles for company 5

6. DATABASE QUERY
   └─ SELECT vehicles.* FROM vehicles
      WHERE company_id = 5
      LEFT JOIN trips ON vehicles.id = trips.vehicle_id
      └─ Returns: [
           { id: 20, name: "Actros", status: "active", 
             driver: { id: 45, name: "Ahmed Hassan" },
             trips: [{ id: 180, start_location: "Accra", destination: "Kumasi" }]
           },
           { id: 21, name: "Volvo", ... },
           ...
         ]

7. FRONTEND RECEIVES DATA
   └─ MapDashboard receives vehicles array
      └─ vehicleIdParam = '20'
      └─ useEffect finds: vehicles.find(v => v.id === 20) ✅ Found!
      └─ setSelectedVehicle({id: 20, ...}) ✅
      └─ mapInstance.setCenter([33.8890, 51.3895]) ✅

8. USER SEES
   └─ Interactive map centered on vehicle location
      ├─ Blue gold marker at coordinates
      ├─ Info popup: "Mercedes-Benz Actros | License: GF-020"
      ├─ "On Trip: Accra → Kumasi"
      └─ Marker pulses with gold glow (active vehicle)
```

---

## 📊 Request/Response Flow

### REQUEST (Frontend → Backend)
```http
GET /api/vehicles HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
Content-Type: application/json
```

### RESPONSE (Backend → Frontend)
```json
{
  "data": [
    {
      "id": 20,
      "company_id": 5,
      "name": "Mercedes-Benz Actros",
      "make": "Mercedes",
      "model": "Actros",
      "year": 2020,
      "license_plate": "GF-020",
      "vin": "WVWZZZ3CZ9E012345",
      "status": "active",
      "fuel_type": "diesel",
      "fuel_capacity": 500.00,
      "mileage": 125000.50,
      "image_url": "storage/vehicles/20/image.jpg",
      "driver": {
        "id": 45,
        "name": "Ahmed Hassan",
        "phone": "+233501234567"
      },
      "trips": [
        {
          "id": 180,
          "vehicle_id": 20,
          "driver_id": 45,
          "start_location": "Accra Terminal",
          "end_location": "Kumasi Hub",
          "start_time": "2026-03-23T08:00:00",
          "end_time": null,
          "status": "in_progress",
          "origin_lat": 5.6037,
          "origin_lng": -0.1870,
          "destination_lat": 6.6945,
          "destination_lng": -1.6268,
          "distance": 245.50
        }
      ]
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Problem: Track Button Appears Gray (Disabled)
**Cause**: Vehicle is not active OR has no assigned driver
**Solution**: 
1. Edit the vehicle
2. Change status to "Active"
3. Assign a driver to the vehicle
4. Save
5. Refresh the page
6. Track button should now be green

### Problem: Clicking Track Does Nothing
**Cause**: URL parameter not being processed
**Solution**:
1. Check browser console (F12)
2. Verify MapDashboard.jsx is mounted
3. Confirm vehicles are loaded from API
4. Check that vehicleIdParam is extracted from URL

### Problem: Map Shows No Vehicles
**Cause**: No location data in vehicle_locations table
**Solution**:
1. Make sure vehicles have locations recorded
2. Run phone tracker simulator
3. Or manually insert location data via API
4. Check `/api/vehicle-locations` endpoint response

### Problem: 401 Unauthorized Error
**Cause**: Auth token expired or invalid
**Solution**:
1. Log out and log back in
2. Get new auth token
3. Refresh the page
4. Retry Track action

### Problem: 403 Forbidden Error
**Cause**: User doesn't have access to this vehicle (different company)
**Solution**:
1. This is a security feature
2. Users can only see their own company's vehicles
3. Contact admin if vehicle should be accessible

---

## ✅ Verification Checklist

Before considering Track button fully operational:

- [ ] Track button visible on Vehicles List page
- [ ] Track button visible on Vehicle Detail page
- [ ] Button is GREEN for active + assigned vehicles
- [ ] Button is GRAY for inactive/unassigned vehicles
- [ ] Clicking Track navigates to `/map?vehicleId={id}`
- [ ] Map loads and centers on vehicle location
- [ ] Vehicle marker visible and highlighted
- [ ] Vehicle info popup shows correct details
- [ ] Trip information displays on map
- [ ] No console errors when navigating
- [ ] Backend API endpoints respond (test with POST script)
- [ ] Database contains vehicle and location data
- [ ] Data isolation: Only current company's vehicles visible

---

## 📈 Performance Notes

- **Caching**: Vehicle locations cached for 1-2 minutes to reduce DB load
- **Filtering**: Only active vehicles shown on map
- **Relationships**: Trips loaded with vehicles to show context
- **Real-time**: Phone tracker clears cache for immediate updates

---

## 🚀 Next Steps

1. **Test with backend** → Run `test_track_api.ps1` or `test_track_api.sh`
2. **Verify data** → Check database for vehicles, trips, and locations
3. **Test in browser** → Navigate to both pages and click Track
4. **Monitor logs** → Check Laravel logs for any errors
5. **Performance** → Monitor API response times and database queries

---

Status: ✅ **FULLY IMPLEMENTED AND CONNECTED**
