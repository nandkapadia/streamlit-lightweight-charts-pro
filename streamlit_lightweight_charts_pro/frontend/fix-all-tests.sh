#!/bin/bash

# Find all test files that use describe/it/expect but don't import from vitest
echo "Finding test files that need vitest imports..."

for file in $(find src/__tests__ -name "*.test.ts" -o -name "*.test.tsx"); do
  # Check if file uses vitest functions
  if grep -qE "describe\(|it\(|expect\(|beforeEach\(|afterEach\(|beforeAll\(|afterAll\(|vi\." "$file"; then
    # Check if file already imports from vitest
    if ! grep -q "from 'vitest'" "$file"; then
      echo "Fixing: $file"

      # Determine which functions are used
      FUNCTIONS=""
      grep -q "describe(" "$file" && FUNCTIONS="$FUNCTIONS describe"
      grep -q "it(" "$file" && FUNCTIONS="$FUNCTIONS it"
      grep -q "expect(" "$file" && FUNCTIONS="$FUNCTIONS expect"
      grep -q "beforeEach(" "$file" && FUNCTIONS="$FUNCTIONS beforeEach"
      grep -q "afterEach(" "$file" && FUNCTIONS="$FUNCTIONS afterEach"
      grep -q "beforeAll(" "$file" && FUNCTIONS="$FUNCTIONS beforeAll"
      grep -q "afterAll(" "$file" && FUNCTIONS="$FUNCTIONS afterAll"
      grep -q "vi\." "$file" && FUNCTIONS="$FUNCTIONS vi"

      # Convert to comma-separated list
      IMPORT_LIST=$(echo $FUNCTIONS | tr ' ' ',' | sed 's/^,//')

      # Check if it's a React test file (needs jsdom)
      IS_REACT=0
      if grep -qE "@testing-library/react|render\(|screen\.|ReactDOM" "$file"; then
        IS_REACT=1
      fi

      # Create temp file with fixes
      TEMP_FILE="${file}.tmp"

      # Check if file already has jsdom comment
      HAS_JSDOM=0
      if grep -q "@vitest-environment jsdom" "$file"; then
        HAS_JSDOM=1
      fi

      # Write fixed content
      if [ $IS_REACT -eq 1 ] && [ $HAS_JSDOM -eq 0 ]; then
        echo "/**" > "$TEMP_FILE"
        echo " * @vitest-environment jsdom" >> "$TEMP_FILE"
        echo " */" >> "$TEMP_FILE"
        echo "" >> "$TEMP_FILE"
      fi

      # Process the file line by line
      IMPORT_ADDED=0
      FIRST_IMPORT_FOUND=0

      while IFS= read -r line; do
        # Check if this is the first import statement
        if [ $IMPORT_ADDED -eq 0 ] && [[ "$line" =~ ^import ]]; then
          FIRST_IMPORT_FOUND=1

          # Add vitest import before first import
          if [ ! -z "$IMPORT_LIST" ]; then
            echo "import { $IMPORT_LIST } from 'vitest';" >> "$TEMP_FILE"
            IMPORT_ADDED=1
          fi

          # Add jest-dom import if needed
          if [ $IS_REACT -eq 1 ]; then
            if grep -q "toBeInTheDocument\|toBeVisible\|toHaveAttribute" "$file"; then
              if ! grep -q "@testing-library/jest-dom" "$file"; then
                echo "import '@testing-library/jest-dom/vitest';" >> "$TEMP_FILE"
              fi
            fi
          fi
        fi

        # Skip existing @testing-library/jest-dom import (without /vitest)
        if [[ "$line" =~ import.*@testing-library/jest-dom['\"]?$ ]]; then
          continue
        fi

        # Write the original line
        if [ $HAS_JSDOM -eq 0 ] || [[ ! "$line" =~ @vitest-environment ]]; then
          echo "$line" >> "$TEMP_FILE"
        fi
      done < "$file"

      # If no imports were found and we need to add them, add at the beginning
      if [ $IMPORT_ADDED -eq 0 ] && [ ! -z "$IMPORT_LIST" ]; then
        # Create new temp file with imports at the top
        TEMP_FILE2="${file}.tmp2"

        # Add jsdom if needed
        if [ $IS_REACT -eq 1 ] && [ $HAS_JSDOM -eq 0 ]; then
          echo "/**" > "$TEMP_FILE2"
          echo " * @vitest-environment jsdom" >> "$TEMP_FILE2"
          echo " */" >> "$TEMP_FILE2"
          echo "" >> "$TEMP_FILE2"
        fi

        echo "import { $IMPORT_LIST } from 'vitest';" >> "$TEMP_FILE2"

        if [ $IS_REACT -eq 1 ]; then
          if grep -q "toBeInTheDocument\|toBeVisible\|toHaveAttribute" "$file"; then
            echo "import '@testing-library/jest-dom/vitest';" >> "$TEMP_FILE2"
          fi
        fi

        echo "" >> "$TEMP_FILE2"
        cat "$TEMP_FILE" >> "$TEMP_FILE2"
        mv "$TEMP_FILE2" "$TEMP_FILE"
      fi

      # Replace original file
      mv "$TEMP_FILE" "$file"
      echo "  Fixed: $file"
    fi
  fi
done

echo "Done fixing test files!"
