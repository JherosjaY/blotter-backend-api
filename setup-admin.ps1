# Setup Admin Account Script
# This script creates the admins table and seeds the built-in admin account

Write-Host "🚀 Setting up Admin Account..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Run migration to create admins table
Write-Host "📦 Step 1: Creating admins table..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:GigingPanda0125@db.uzpszayxqfgpyoyanvpv.supabase.co:5432/postgres"

# Execute SQL migration
psql $env:DATABASE_URL -f add-admins-table.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Admins table created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create admins table" -ForegroundColor Red
    Write-Host "Trying alternative method with bun..." -ForegroundColor Yellow
    
    # Alternative: Use bun to push schema
    bun run db:push
}

Write-Host ""

# Step 2: Seed admin account
Write-Host "📦 Step 2: Seeding admin account..." -ForegroundColor Yellow
bun run src/db/seed-admin.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Admin account seeded successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Setup Complete!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Admin Credentials:" -ForegroundColor White
    Write-Host "  Username: official.bms.admin" -ForegroundColor Green
    Write-Host "  Password: @BMSOFFICIAL2025" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now login from any device using these credentials." -ForegroundColor White
} else {
    Write-Host "❌ Failed to seed admin account" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
}
