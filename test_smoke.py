#!/usr/bin/env python3
"""Smoke test for AgroSmart app"""

import requests
import time
import json

BASE_URL = "http://127.0.0.1:8000"
API_URL = f"{BASE_URL}/api"

tests_passed = 0
tests_failed = 0

def test(name, func):
    global tests_passed, tests_failed
    print(f"\n{name}")
    try:
        func()
        tests_passed += 1
        print(f"  ✓ PASSED")
    except AssertionError as e:
        tests_failed += 1
        print(f"  ✗ FAILED: {e}")
    except Exception as e:
        tests_failed += 1
        print(f"  ✗ ERROR: {e}")

print("=" * 60)
print("AGROSMART SMOKE TEST")
print("=" * 60)

# Test 1: Backend Health
def test_health():
    resp = requests.get(BASE_URL, timeout=5)
    assert resp.status_code == 200, f"Got {resp.status_code}"
    data = resp.json()
    assert data.get("status") == "ok", f"Status: {data.get('status')}"
    print(f"  Backend: {data.get('name')}")

test("1. Backend Health Check", test_health)

# Test 2: Signup
token = None
email = None

def test_signup():
    global token, email
    import random
    ts = random.randint(1000, 9999)
    email = f"farmer_test{ts}@agrotest.com"
    
    payload = {
        "username": f"farmer_test{ts}",
        "email": email,
        "password": "TestPass1234567!",
        "full_name": "Test Farmer",
        "role": "farmer"
    }
    
    resp = requests.post(
        f"{API_URL}/auth/register/",
        json=payload,
        timeout=5
    )
    
    assert resp.status_code in [200, 201], f"Got {resp.status_code}: {resp.text}"
    data = resp.json()
    token = data.get("access")
    assert token, f"No token in response: {data}"
    print(f"  Email: {email}")
    print(f"  Token: {token[:30]}...")

test("2. User Signup", test_signup)

# Skip remaining tests if signup failed
if not token:
    print("\n" + "=" * 60)
    print(f"RESULTS: {tests_passed} passed, {tests_failed} failed")
    exit(1 if tests_failed else 0)

# Test 3: Setup Profile
def test_setup():
    payload = {
        "full_name": "Test Farmer",
        "location": "Lagos, Nigeria",
        "crop": "Maize",
        "farm_size": 5
    }
    
    resp = requests.post(
        f"{API_URL}/onboarding/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=5
    )
    
    print(f"  Status: {resp.status_code}")
    assert resp.status_code in [200, 201], f"Got {resp.status_code}: {resp.text}"

test("3. Complete Farm Setup", test_setup)

# Test 4: Forgot Password
def test_forgot_password():
    payload = {"email": email}
    
    resp = requests.post(
        f"{API_URL}/auth/forgot-password/",
        json=payload,
        timeout=5
    )
    
    print(f"  Status: {resp.status_code}")
    assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text}"
    data = resp.json()
    print(f"  Response: {data.get('detail', 'OK')}")

test("4. Password Reset Request", test_forgot_password)

print("\n" + "=" * 60)
print(f"RESULTS: {tests_passed} passed, {tests_failed} failed")
print("=" * 60)

if tests_failed == 0:
    print("\n✓ ALL TESTS PASSED")
    print("  Backend API: Running")
    print("  Authentication: Working")
    print("  Farm Setup: Functional")
    print("  Password Reset: Active")
    print("\nFrontend: http://localhost:5175")
    exit(0)
else:
    print(f"\n✗ {tests_failed} test(s) failed")
    exit(1)
