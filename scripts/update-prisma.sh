#!/bin/bash

# Prisma Database Update Script
# Tự động generate client, push schema và restart Prisma Studio

set -e  # Exit on any error

echo "🚀 Starting Prisma Database Update..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "database/prisma/schema.prisma" ]; then
    print_error "Schema file not found! Please run this script from the project root."
    exit 1
fi

# Step 1: Kill existing Prisma Studio process
print_status "Stopping existing Prisma Studio..."
pkill -f "prisma studio" || print_warning "No Prisma Studio process found to kill"

# Step 2: Generate Prisma Client
print_status "Generating Prisma Client..."
if npx prisma generate --schema=./database/prisma/schema.prisma; then
    print_success "Prisma Client generated successfully!"
else
    print_error "Failed to generate Prisma Client"
    exit 1
fi

# Step 3: Push schema to database
print_status "Pushing schema to database..."
if npx prisma db push --schema=./database/prisma/schema.prisma; then
    print_success "Schema pushed to database successfully!"
else
    print_error "Failed to push schema to database"
    exit 1
fi

# Step 4: Validate schema
print_status "Validating schema..."
if npx prisma validate --schema=./database/prisma/schema.prisma; then
    print_success "Schema validation passed!"
else
    print_error "Schema validation failed"
    exit 1
fi

# Step 5: Start Prisma Studio (optional)
read -p "Do you want to start Prisma Studio? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Starting Prisma Studio..."
    npx prisma studio --schema=./database/prisma/schema.prisma &
    print_success "Prisma Studio started at http://localhost:5555"
    print_warning "Press Ctrl+C to stop Prisma Studio when done"
    wait
else
    print_status "Prisma Studio not started. You can start it manually with:"
    echo "npx prisma studio --schema=./database/prisma/schema.prisma"
fi

print_success "🎉 Prisma Database Update completed successfully!"


