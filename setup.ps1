# Blotter Backend - Quick Setup Script
# This script helps you set up the backend quickly

Write-Host "🚀 Blotter Backend - Quick Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Bun
Write-Host "1️⃣  Checking Bun installation..." -ForegroundColor Yellow
try {
    $bunVersion = bun --version
    Write-Host "✅ Bun is installed: v$bunVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Bun is not installed!" -ForegroundColor Red
    Write-Host "   Install from: https://bun.sh" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 2: Check .env
Write-Host "2️⃣  Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
    
    # Check if DATABASE_URL is configured
    $envContent = Get-Content .env -Raw
    if ($envContent -match "DATABASE_URL=postgresql://.*@.*/.+") {
        Write-Host "✅ DATABASE_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  DATABASE_URL needs configuration!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📝 Please configure your database:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Option 1: Neon (Free Cloud Database - RECOMMENDED)" -ForegroundColor White
        Write-Host "  1. Go to https://neon.tech" -ForegroundColor Gray
        Write-Host "  2. Sign up (free no credit card)" -ForegroundColor Gray
        Write-Host "  3. Create project blotter-management" -ForegroundColor Gray
        Write-Host "  4. Copy connection string" -ForegroundColor Gray
        Write-Host "  5. Paste in .env file" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Option 2: Local PostgreSQL" -ForegroundColor White
        Write-Host "  DATABASE_URL=postgresql://postgres:password@localhost:5432/blotter_db" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Press any key to open .env file..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        notepad .env
        exit 0
    }
} else {
    Write-Host "⚠️  .env file not found, creating from example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Please configure DATABASE_URL in .env file" -ForegroundColor Yellow
    Write-Host "   Opening .env file..." -ForegroundColor Gray
    Start-Sleep -Seconds 1
    notepad .env
    exit 0
}
Write-Host ""

# Step 3: Install Dependencies
Write-Host "3️⃣  Installing dependencies..." -ForegroundColor Yellow
bun install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Push Database Schema
Write-Host "4️⃣  Creating database tables..." -ForegroundColor Yellow
Write-Host "   This will create all 17 tables in your database..." -ForegroundColor Gray
bun run db:push
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database tables created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create tables" -ForegroundColor Red
    Write-Host "   Please check your DATABASE_URL in .env" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 5: Seed Sample Data
Write-Host "5️⃣  Adding sample data..." -ForegroundColor Yellow
Write-Host "   This will create test users, officers, and reports..." -ForegroundColor Gray
bun run db:seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sample data added" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to seed data (tables might already have data)" -ForegroundColor Yellow
}
Write-Host ""

# Success!
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start backend:" -ForegroundColor White
Write-Host "   bun run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test API:" -ForegroundColor White
Write-Host "   bun run test" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open Swagger:" -ForegroundColor White
Write-Host "   http://localhost:3000/swagger" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Run Android app" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Test Credentials:" -ForegroundColor Cyan
Write-Host "   Admin:   admin / admin123" -ForegroundColor Gray
Write-Host "   Officer: officer1 / officer123" -ForegroundColor Gray
Write-Host "   User:    user1 / user123" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to start backend server..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
bun run dev
