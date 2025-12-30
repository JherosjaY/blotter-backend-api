# Blotter API Test Script
# This script tests all major API endpoints

Write-Host "🧪 Testing Blotter Management System API" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "1️⃣  Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health Check: " -ForegroundColor Green -NoNewline
    Write-Host "$($response | ConvertTo-Json -Compress)"
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Root Endpoint
Write-Host "2️⃣  Testing Root Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "✅ Root Endpoint: " -ForegroundColor Green -NoNewline
    Write-Host "$($response.message)"
} catch {
    Write-Host "❌ Root Endpoint Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Dashboard Analytics
Write-Host "3️⃣  Testing Dashboard Analytics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/analytics" -Method Get
    Write-Host "✅ Dashboard Analytics:" -ForegroundColor Green
    Write-Host "   - Total Reports: $($response.data.totalReports)"
    Write-Host "   - Pending: $($response.data.pendingReports)"
    Write-Host "   - Ongoing: $($response.data.ongoingReports)"
    Write-Host "   - Resolved: $($response.data.resolvedReports)"
    Write-Host "   - Total Officers: $($response.data.totalOfficers)"
    Write-Host "   - Total Users: $($response.data.totalUsers)"
} catch {
    Write-Host "❌ Dashboard Analytics Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get All Reports
Write-Host "4️⃣  Testing Get All Reports..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports" -Method Get
    Write-Host "✅ Reports Retrieved: $($response.data.Count) reports found" -ForegroundColor Green
    if ($response.data.Count -gt 0) {
        Write-Host "   First Report: $($response.data[0].caseNumber) - $($response.data[0].incidentType)"
    }
} catch {
    Write-Host "❌ Get Reports Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get All Users
Write-Host "5️⃣  Testing Get All Users..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get
    Write-Host "✅ Users Retrieved: $($response.data.Count) users found" -ForegroundColor Green
    if ($response.data.Count -gt 0) {
        Write-Host "   First User: $($response.data[0].username) ($($response.data[0].role))"
    }
} catch {
    Write-Host "❌ Get Users Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get All Officers
Write-Host "6️⃣  Testing Get All Officers..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/officers" -Method Get
    Write-Host "✅ Officers Retrieved: $($response.data.Count) officers found" -ForegroundColor Green
    if ($response.data.Count -gt 0) {
        Write-Host "   First Officer: $($response.data[0].name) - Badge: $($response.data[0].badgeNumber)"
    }
} catch {
    Write-Host "❌ Get Officers Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Get All Persons
Write-Host "7️⃣  Testing Get All Persons..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/persons" -Method Get
    Write-Host "✅ Persons Retrieved: $($response.count) persons found" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Persons Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Get All Evidence
Write-Host "8️⃣  Testing Get All Evidence..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/evidence" -Method Get
    Write-Host "✅ Evidence Retrieved: $($response.count) evidence items found" -ForegroundColor Green
} catch {
    Write-Host "❌ Get Evidence Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: Login Test
Write-Host "9️⃣  Testing Login (Admin)..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host "   User: $($response.data.user.username)"
    Write-Host "   Role: $($response.data.user.role)"
    Write-Host "   Token: $($response.data.token.Substring(0, 20))..."
} catch {
    Write-Host "❌ Login Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 10: Create New Report
Write-Host "🔟 Testing Create Report..." -ForegroundColor Yellow
try {
    $newReport = @{
        caseNumber = "TEST-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        incidentType = "Test Incident"
        incidentDate = "2025-01-25"
        incidentTime = "18:00"
        incidentLocation = "Test Location, CDO City"
        narrative = "This is a test report created by API test script"
        complainantName = "Test Complainant"
        complainantContact = "09991234567"
        status = "Pending"
        priority = "Normal"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/reports" -Method Post -Body $newReport -ContentType "application/json"
    Write-Host "✅ Report Created Successfully!" -ForegroundColor Green
    Write-Host "   Case Number: $($response.data.caseNumber)"
    Write-Host "   Status: $($response.data.status)"
} catch {
    Write-Host "❌ Create Report Failed: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open Swagger UI: http://localhost:3000/swagger"
Write-Host "2. Run Android app in emulator"
Write-Host "3. Test login with: admin / admin123"
Write-Host ""
