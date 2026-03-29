#!/usr/bin/env pwsh

$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$username = "testfarmer_$timestamp"
$email = "testfarmer_$timestamp@test.com"
$password = "TestPass123456789"

Write-Host "=== 1. API Health Check ===" -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/" -Method GET
Write-Host "Backend: $($health.name)"
Write-Host "Status: $($health.status)"
Write-Host ""

Write-Host "=== 2. Signup ===" -ForegroundColor Cyan
$signupJson = @{
    username = $username
    email = $email
    password = $password
    full_name = "Test Farmer"
    role = "farmer"
} | ConvertTo-Json

try {
  $signup = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/register/" `
    -Method POST `
    -ContentType "application/json" `
    -Body $signupJson
}
catch {
  Write-Host "[FAILED] Signup request failed: $_" -ForegroundColor Red
  exit 1
}

$token = $signup.access
if (-not $token) {
  Write-Host "[FAILED] Signup did not return an access token." -ForegroundColor Red
  exit 1
}

Write-Host "[+] Token obtained: $($token.Substring(0, 20))..."
Write-Host ""

Write-Host "=== 3. Complete Setup ===" -ForegroundColor Cyan
$setupJson = @{
    full_name = "Test Farmer"
    location = "Lagos, Nigeria"
    crop = "Maize"
    farm_size = 5
} | ConvertTo-Json

try {
  $setupResp = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/onboarding/profile" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $setupJson
  Write-Host "Setup response: $($setupResp | ConvertTo-Json -Compress)"
}
catch {
  Write-Host "[FAILED] Setup request failed: $_" -ForegroundColor Red
  exit 1
}
Write-Host ""

Write-Host "=== 4. Forgot Password Request ===" -ForegroundColor Cyan
$forgotJson = @{
    email = $email
} | ConvertTo-Json

try {
  $forgotResp = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/forgot-password/" `
    -Method POST `
    -ContentType "application/json" `
    -Body $forgotJson
  Write-Host "Forgot password response: $($forgotResp | ConvertTo-Json -Compress)"
}
catch {
  Write-Host "[FAILED] Forgot password request failed: $_" -ForegroundColor Red
  exit 1
}
Write-Host ""

Write-Host "=== ALL SMOKE TESTS COMPLETE ===" -ForegroundColor Green
Write-Host "[+] API is running and responding"
Write-Host "[+] Signup/login works"
Write-Host "[+] Setup profile endpoint works"
Write-Host "[+] Password reset endpoint works"
