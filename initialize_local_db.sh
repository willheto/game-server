#!/bin/bash

# Define the migrations directory
MIGRATIONS_DIR="./db/migrations"

# Check if the migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found!"
  exit 1
fi

# Function to run migrations
run_migration() {
  local migration_file="$1"
  local action="$2"

  echo "Running migration: $migration_file $action..."
  
  npx ts-node "$migration_file" "$action"
}

for migration in "$MIGRATIONS_DIR"/*.ts; do
  if [ -f "$migration" ]; then
    run_migration "$migration" "down"
    run_migration "$migration" "up"
  else
    echo "No migration files found."
  fi
done

echo "All migrations processed."
