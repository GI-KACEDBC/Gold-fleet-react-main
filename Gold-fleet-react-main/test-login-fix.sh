#!/bin/bash

# LOGIN AUTHORIZATION FIX - TEST SCRIPT
# This script tests the three login systems to verify the fix is working

API_URL="http://localhost:8000/api"

echo "================================================"
echo "LOGIN AUTHORIZATION FIX - TEST CASES"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# TEST SETUP
echo "${YELLOW}SETUP${NC}"
echo "Make sure the backend server is running at http://localhost:8000"
echo ""

# TEST 1: Invalid credentials
echo "${YELLOW}TEST 1: Invalid Credentials (Should fail with 401)${NC}"
echo "Testing: POST /api/login with wrong password"
curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrongpassword"}' | jq '.'
echo ""
echo ""

# TEST 2: Driver Login Success (requires driver account in database)
echo "${YELLOW}TEST 2: Driver Login Success (if driver exists)${NC}"
echo "Testing: POST /api/login with driver credentials"
echo "NOTE: This requires a driver account in your database"
echo "Command:"
echo "curl -s -X POST \"$API_URL/login\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"driver@company.com\",\"password\":\"password123\"}'"
echo ""
echo ""

# TEST 3: Company Admin Blocked from Driver Login
echo "${YELLOW}TEST 3: Company Admin Blocked from Driver Login (should fail with 403)${NC}"
echo "Testing: POST /api/login with company admin credentials"
echo "NOTE: This requires a company admin account (role='admin') in your database"
echo "Command:"
echo "curl -s -X POST \"$API_URL/login\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"admin@company.com\",\"password\":\"password123\"}'"
echo ""
echo "Expected Response: 403 Forbidden"
echo "{\"success\":false,\"message\":\"This login method is for drivers only...\"}"
echo ""
echo ""

# TEST 4: Company Admin Login Success
echo "${YELLOW}TEST 4: Company Admin Login Success${NC}"
echo "Testing: POST /api/company-admin-login with company admin credentials"
echo "NOTE: This requires a company admin account (role='admin') in your database"
echo "Command:"
echo "curl -s -X POST \"$API_URL/company-admin-login\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"admin@company.com\",\"password\":\"password123\"}'"
echo ""
echo "Expected Response: 200 OK with token and user data"
echo ""
echo ""

# TEST 5: Frontend Behavior
echo "${YELLOW}TEST 5: Frontend Login Behavior${NC}"
echo "The frontend login function now automatically:"
echo "1. Tries POST /api/login first (driver login)"
echo "2. If receives 403 Forbidden, tries POST /api/company-admin-login"
echo "3. Returns token and user data for successful login"
echo ""
echo ""

echo "${GREEN}================================================"
echo "TEST CASES COMPLETE"
echo "================================================${NC}"
echo ""
echo "To test with real data, you need:"
echo "1. A driver account with role='driver'"
echo "2. A company admin account with role='admin' and company_id set"
echo ""
echo "Database Query to check users:"
echo "SELECT id, name, email, role, company_id FROM users;"
