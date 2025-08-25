# Prisma Database Update Script for Windows
# Tự động generate client, push schema và restart Prisma Studio

param(
    [switch]$StartStudio
)

Write-Host "🚀 Starting Prisma Database Update..." -ForegroundColor Cyan

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "database/prisma/schema.prisma")) {
    Write-Error "Schema file not found! Please run this script from the project root."
    exit 1
}

# Step 1: Kill existing Prisma Studio process
Write-Status "Stopping existing Prisma Studio..."
try {
    Get-Process | Where-Object {$_.ProcessName -like "*node*" -and $_.CommandLine -like "*prisma studio*"} | Stop-Process -Force
    Write-Success "Prisma Studio stopped"
} catch {
    Write-Warning "No Prisma Studio process found to kill"
}

# Step 2: Generate Prisma Client
Write-Status "Generating Prisma Client..."
try {
    npx prisma generate --schema=./database/prisma/schema.prisma
    Write-Success "Prisma Client generated successfully!"
} catch {
    Write-Error "Failed to generate Prisma Client"
    exit 1
}

# Step 3: Push schema to database
Write-Status "Pushing schema to database..."
try {
    npx prisma db push --schema=./database/prisma/schema.prisma
    Write-Success "Schema pushed to database successfully!"
} catch {
    Write-Error "Failed to push schema to database"
    exit 1
}

# Step 4: Validate schema
Write-Status "Validating schema..."
try {
    npx prisma validate --schema=./database/prisma/schema.prisma
    Write-Success "Schema validation passed!"
} catch {
    Write-Error "Schema validation failed"
    exit 1
}

# Step 5: Start Prisma Studio (optional)
if ($StartStudio) {
    Write-Status "Starting Prisma Studio..."
    Start-Process -NoNewWindow npx -ArgumentList "prisma studio --schema=./database/prisma/schema.prisma"
    Write-Success "Prisma Studio started at http://localhost:5555"
} else {
    $response = Read-Host "Do you want to start Prisma Studio? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Status "Starting Prisma Studio..."
        Start-Process -NoNewWindow npx -ArgumentList "prisma studio --schema=./database/prisma/schema.prisma"
        Write-Success "Prisma Studio started at http://localhost:5555"
    } else {
        Write-Status "Prisma Studio not started. You can start it manually with:"
        Write-Host "npx prisma studio --schema=./database/prisma/schema.prisma"
    }
}

Write-Success "🎉 Prisma Database Update completed successfully!"


