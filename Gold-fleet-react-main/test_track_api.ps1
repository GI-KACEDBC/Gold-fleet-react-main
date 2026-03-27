# Backend API Connection Test Script (PowerShell)
# This script tests all Track button related API endpoints

$API_BASE_URL = "http://localhost:8000/api"
$AUTH_TOKEN = "your_auth_token_here"  # Replace with actual token

Write-Host "==================================" -ForegroundColor Yellow
Write-Host "🧪 TRACK BUTTON API TEST SUITE" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""

# Headers for all requests
$headers = @{
    "Authorization" = "Bearer $AUTH_TOKEN"
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

# Test 1: Get Vehicles
Write-Host "Test 1: GET /api/vehicles" -ForegroundColor Cyan
Write-Host "Purpose: Load all vehicles with trips"
Write-Host "Expected: Array of vehicle objects with trips data"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/vehicles" `
        -Method Get `
        -Headers $headers
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure: auth token is valid and server is running"
}
Write-Host ""
Write-Host ""

# Test 2: Get Specific Vehicle
Write-Host "Test 2: GET /api/vehicles/{id}" -ForegroundColor Cyan
Write-Host "Purpose: Get single vehicle with all related data"
Write-Host "Expected: Vehicle object with trips, services, issues, etc."
Write-Host "URL: /api/vehicles/20"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/vehicles/20" `
        -Method Get `
        -Headers $headers
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Vehicle ID 20 may not exist. Try another ID."
}
Write-Host ""
Write-Host ""

# Test 3: Get Vehicle Locations (Map Data)
Write-Host "Test 3: GET /api/vehicle-locations" -ForegroundColor Cyan
Write-Host "Purpose: Get real-time vehicle locations for map"
Write-Host "Expected: Array of locations with vehicle_id, latitude, longitude"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/vehicle-locations" `
        -Method Get `
        -Headers $headers
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure vehicle location data exists in database."
}
Write-Host ""
Write-Host ""

# Test 4: Get Last Location of a Vehicle
Write-Host "Test 4: GET /api/tracker/last-location/{vehicleId}" -ForegroundColor Cyan
Write-Host "Purpose: Get most recent location of specific vehicle"
Write-Host "Expected: Latest location object with coordinates"
Write-Host "URL: /api/tracker/last-location/20"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/tracker/last-location/20" `
        -Method Get `
        -Headers $headers
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Vehicle 20 may not have location data."
}
Write-Host ""
Write-Host ""

# Test 5: Get Trips
Write-Host "Test 5: GET /api/trips" -ForegroundColor Cyan
Write-Host "Purpose: Get all trips with vehicle and driver data"
Write-Host "Expected: Array of trip objects with vehicle and driver info"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_BASE_URL/trips" `
        -Method Get `
        -Headers $headers
    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3)
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure trip data exists in database."
}
Write-Host ""
Write-Host ""

Write-Host "==================================" -ForegroundColor Yellow
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host "1. Replace 'your_auth_token_here' with your actual auth token" -ForegroundColor Cyan
Write-Host "2. Ensure Laravel server is running: php artisan serve" -ForegroundColor Cyan
Write-Host "3. Replace vehicle ID '20' with an actual vehicle ID from your database" -ForegroundColor Cyan
Write-Host "4. Run: .\test_track_api.ps1" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 SUMMARY:" -ForegroundColor Yellow
Write-Host "✅ If all tests pass: Backend is fully connected to Track button" -ForegroundColor Green
Write-Host "❌ If any fail: Check server logs and database" -ForegroundColor Red
