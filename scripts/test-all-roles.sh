#!/bin/bash
# =====================================================
# E2E Test Runner for All Roles
# Location: scripts/test-all-roles.sh
# =====================================================

# Test user credentials (create these in Supabase first!)
# All use the same password for simplicity
TEST_PASSWORD="TestPass123!"

# Define test users for each role
declare -A ROLE_EMAILS=(
  ["admin"]="e2e.admin@amsf001.test"
  ["supplier_pm"]="e2e.supplier.pm@amsf001.test"
  ["supplier_finance"]="e2e.supplier.finance@amsf001.test"
  ["customer_pm"]="e2e.customer.pm@amsf001.test"
  ["customer_finance"]="e2e.customer.finance@amsf001.test"
  ["contributor"]="e2e.contributor@amsf001.test"
  ["viewer"]="e2e.viewer@amsf001.test"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  E2E Test Runner - All Roles"
echo "========================================"
echo ""

# Check if a specific role was requested
if [ -n "$1" ]; then
  ROLES=("$1")
else
  ROLES=("admin" "supplier_pm" "supplier_finance" "customer_pm" "customer_finance" "contributor" "viewer")
fi

# Track results
PASSED=0
FAILED=0

for role in "${ROLES[@]}"; do
  email="${ROLE_EMAILS[$role]}"
  
  if [ -z "$email" ]; then
    echo -e "${RED}Unknown role: $role${NC}"
    continue
  fi
  
  echo ""
  echo -e "${YELLOW}Testing role: $role${NC}"
  echo "  Email: $email"
  echo "----------------------------------------"
  
  # Run tests for this role
  E2E_TEST_EMAIL="$email" \
  E2E_TEST_PASSWORD="$TEST_PASSWORD" \
  E2E_CURRENT_ROLE="$role" \
  npx playwright test --grep "@$role|@all-roles" --reporter=list
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ $role tests passed${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ $role tests failed${NC}"
    ((FAILED++))
  fi
done

echo ""
echo "========================================"
echo "  Summary"
echo "========================================"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo "========================================"

# Exit with error if any failed
[ $FAILED -eq 0 ]
