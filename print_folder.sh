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

# Function to check if directory is empty
is_dir_empty() {
  local dir="$1"
  local count=0
  
  # Count visible contents (excluding hidden files)
  for item in "$dir"/*; do
    if [ -e "$item" ]; then
      # Check if this item would be excluded
      if ! should_exclude "$item"; then
        count=$((count+1))
        break
      fi
    fi
  done
  
  # If count is still 0, directory is empty (or contains only hidden/excluded files)
  [ $count -eq 0 ]
}

# Function to traverse directory and print structure
traverse_dir() {
  local dir="$1"
  local indent="$2"
  local base_dir="$(basename "$dir")"
  
  # Check if directory is empty
  local empty_indicator=""
  if is_dir_empty "$dir"; then
    empty_indicator=" [empty]"
  fi
  
  # Print current directory
  echo "${indent}${base_dir}/${empty_indicator}" >> "$output_file"
  
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
      # Check if file is empty - use wc for better compatibility on Mac
      local file_size=$(wc -c < "$item")
      local file_empty=""
      if [ "$file_size" -eq 0 ]; then
        file_empty=" [empty]"
      fi
      
      # Print file name
      echo "${indent}  $(basename "$item")${file_empty}" >> "$output_file"
    fi
  done
}

# Start traversing from current directory
echo "Capturing folder structure while excluding unwanted files and directories..."
current_dir=$(pwd)
traverse_dir "$current_dir" ""
echo "Done! Structure saved to $output_file"