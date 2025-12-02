#!/bin/bash

# Run frontend tests in batches to prevent memory issues
# This script runs tests one directory at a time with cleanup between batches

set -e

echo "🧪 Running Frontend Tests in Batches"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Memory settings
export NODE_OPTIONS='--max-old-space-size=4096 --max-semi-space-size=256 --expose-gc'

# Track failures
declare -a FAILED_BATCHES=()
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test directories in order of complexity (simplest first)
# Note: services is excluded here and run separately in smaller batches below
TEST_DIRS=(
  "src/__tests__/config"
  "src/__tests__/utils"
  "src/__tests__/helpers"
  "src/__tests__/hooks"
  "src/__tests__/mocks"
  "src/__tests__/setup"
  "src/__tests__/primitives"
  "src/__tests__/plugins"
  "src/__tests__/components"
)

# Services test files - run individually due to memory constraints
# Note: ChartCoordinateService.test.ts is excluded from batched tests due to extreme memory usage
# Run individually: npx vitest run src/__tests__/services/ChartCoordinateService.test.ts --pool=threads
SERVICE_TEST_FILES=(
  "src/__tests__/services/ChartPrimitiveManager.test.ts"
  "src/__tests__/services/ChartSyncManager.test.ts"
  "src/__tests__/services/CornerLayoutManager.test.ts"
  "src/__tests__/services/PaneCollapseManager.test.ts"
  "src/__tests__/services/PrimitiveEventManager.test.ts"
  "src/__tests__/services/SeriesDialogManager.test.ts"
  "src/__tests__/services/StreamlitSeriesConfigService.test.ts"
  "src/__tests__/services/annotationSystem.test.ts"
  "src/__tests__/services/tradeVisualization.test.ts"
)

run_test_batch() {
  local dir=$1
  echo -e "${BLUE}[INFO]${NC} Running tests in: $dir"

  # Check if directory has test files
  if ! find "$dir" -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}[SKIP]${NC} No test files found in: $dir"
    return 0
  fi

  if npx vitest run "$dir" --pool=forks --poolOptions.forks.singleFork=true --no-coverage 2>&1; then
    echo -e "${GREEN}[SUCCESS]${NC} Tests passed: $dir"
    return 0
  else
    echo -e "${RED}[FAILED]${NC} Tests failed: $dir"
    FAILED_BATCHES+=("$dir")
    return 1
  fi
}

# Run tests for each directory
for dir in "${TEST_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    run_test_batch "$dir"
    # Force garbage collection between batches
    sleep 2
    echo ""
  else
    echo -e "${YELLOW}[SKIP]${NC} Directory not found: $dir"
  fi
done

# Run services tests individually with increased memory
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Running Services Tests (Individual Files)${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

for file in "${SERVICE_TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    # ChartCoordinateService needs extra memory due to comprehensive test suite
    if [[ "$file" == *"ChartCoordinateService"* ]]; then
      echo -e "${YELLOW}[INFO]${NC} Running ChartCoordinateService with extra memory..."
      export NODE_OPTIONS='--max-old-space-size=8192 --max-semi-space-size=1024 --expose-gc'
      run_test_batch "$file"
      export NODE_OPTIONS='--max-old-space-size=4096 --max-semi-space-size=256 --expose-gc'
    else
      run_test_batch "$file"
    fi
    # Force garbage collection between batches
    sleep 2
    echo ""
  else
    echo -e "${YELLOW}[SKIP]${NC} File not found: $file"
  fi
done

# Summary
echo ""
echo "======================================"
echo "📊 Test Summary"
echo "======================================"

if [ ${#FAILED_BATCHES[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All test batches passed!${NC}"
  echo ""
  echo -e "${BLUE}ℹ️  Note:${NC} ChartCoordinateService.test.ts is excluded from batched runs"
  echo -e "   Run separately: ${YELLOW}npx vitest run src/__tests__/services/ChartCoordinateService.test.ts --pool=threads${NC}"
  exit 0
else
  echo -e "${RED}❌ Some test batches failed:${NC}"
  for batch in "${FAILED_BATCHES[@]}"; do
    echo -e "  ${RED}•${NC} $batch"
  done
  exit 1
fi
