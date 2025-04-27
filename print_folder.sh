#!/bin/bash

# Create output file
output_file="structure.txt"
> "$output_file"  # Clear file if it exists

# Define directories and patterns to exclude
exclude_patterns=(
  "node_modules"
  "*cache*"
  "*test*"
  ".git*"
  "__pycache__"
  ".temp"
  "venv"
  "env"
  "lib"
)

# Function to check if a path should be excluded
should_exclude() {
  local path="$1"
  local basename=$(basename "$path")
  
  for pattern in "${exclude_patterns[@]}"; do
    if [[ "$basename" == $pattern || "$basename" == .* || "$basename" =~ $pattern ]]; then
      return 0  # Should exclude
    fi
  done
  
  return 1  # Should not exclude
}

# Function to traverse directory and print structure
traverse_dir() {
  local dir="$1"
  local indent="$2"
  local base_dir="$(basename "$dir")"
  
  # Print current directory
  echo "${indent}${base_dir}/" >> "$output_file"
  
  # Get all files and directories, sorted
  local items=()
  while IFS= read -r item; do
    items+=("$item")
  done < <(find "$dir" -mindepth 1 -maxdepth 1 | sort)
  
  # Process each item
  for item in "${items[@]}"; do
    if should_exclude "$item"; then
      continue  # Skip this item
    fi
    
    if [ -d "$item" ]; then
      # Recursively traverse subdirectories
      traverse_dir "$item" "${indent}  "
    elif [ -f "$item" ]; then
      # Print file name
      echo "${indent}  $(basename "$item")" >> "$output_file"
    fi
  done
}

# Start traversing from current directory
echo "Capturing folder structure while excluding unwanted files and directories..."
current_dir=$(pwd)
traverse_dir "$current_dir" ""
echo "Done! Structure saved to $output_file"