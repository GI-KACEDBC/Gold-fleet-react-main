#!/bin/bash
# Backend API Connection Test Script
# This script tests all Track button related API endpoints

API_BASE_URL="http://localhost:8000/api"
AUTH_TOKEN="your_auth_token_here"  # Replace with actual token

echo "=================================="
echo "🧪 TRACK BUTTON API TEST SUITE"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Get Vehicles
echo -e "${YELLOW}Test 1: GET /api/vehicles${NC}"
echo "Purpose: Load all vehicles with trips"
echo "Expected: Array of vehicle objects with trips data"
echo ""
curl -X GET "$API_BASE_URL/vehicles" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -s | jq '.' 2>/dev/null || echo "Error: Could not parse response (is server running?)"
echo ""
echo ""

# Test 2: Get Specific Vehicle
echo -e "${YELLOW}Test 2: GET /api/vehicles/{id}${NC}"
echo "Purpose: Get single vehicle with all related data"
echo "Expected: Vehicle object with trips, services, issues, etc."
echo "URL: /api/vehicles/20"
echo ""
curl -X GET "$API_BASE_URL/vehicles/20" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -s | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Test 3: Get Vehicle Locations (Map Data)
echo -e "${YELLOW}Test 3: GET /api/vehicle-locations${NC}"
echo "Purpose: Get real-time vehicle locations for map"
echo "Expected: Array of locations with vehicle_id, latitude, longitude"
echo ""
curl -X GET "$API_BASE_URL/vehicle-locations" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -s | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Test 4: Get Last Location of a Vehicle
echo -e "${YELLOW}Test 4: GET /api/tracker/last-location/{vehicleId}${NC}"
echo "Purpose: Get most recent location of specific vehicle"
echo "Expected: Latest location object with coordinates"
echo "URL: /api/tracker/last-location/20"
echo ""
curl -X GET "$API_BASE_URL/tracker/last-location/20" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -s | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

# Test 5: Get Trips
echo -e "${YELLOW}Test 5: GET /api/trips${NC}"
echo "Purpose: Get all trips with vehicle and driver data"
echo "Expected: Array of trip objects with vehicle and driver info"
echo ""
curl -X GET "$API_BASE_URL/trips" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -s | jq '.' 2>/dev/null || echo "Error: Could not parse response"
echo ""
echo ""

echo -e "${YELLOW}=================================="
echo "INSTRUCTIONS:"
echo "================================="
echo "1. Replace 'your_auth_token_here' with your actual auth token"
echo "2. Ensure Laravel server is running: php artisan serve"
echo "3. Replace vehicle ID '20' with an actual vehicle ID from your database"
echo "4. Run: bash test_api.sh"
echo "=================================${NC}"
