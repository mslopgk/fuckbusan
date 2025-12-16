import requests
import json
import random

BASE_URL = "http://localhost:8000"

def log(message):
    with open("auth_test_result.txt", "a", encoding="utf-8") as f:
        f.write(message + "\n")

def test_signup():
    random_id = f"testuser_{random.randint(1000, 9999)}"
    payload = {
        "ID": random_id,
        "PW": "Password123!",
        "name": "Test User",
        "nickname": "Tester",
        "phone_num": "010-1234-5678",
        "district_code": "general"
    }
    log(f"Attempting signup with ID: {random_id}")
    try:
        response = requests.post(f"{BASE_URL}/users/signup", json=payload)
        log(f"Signup Status: {response.status_code}")
        log(f"Signup Response: {response.text}")
        if response.status_code == 201:
            return random_id
        else:
            return None
    except Exception as e:
        log(f"Signup Request Failed: {e}")
        return None

def test_login(user_id):
    if not user_id:
        log("Skipping login test due to signup failure")
        return

    payload = {
        "ID": user_id,
        "PW": "Password123!"
    }
    log(f"Attempting login with ID: {user_id}")
    try:
        response = requests.post(f"{BASE_URL}/users/login", json=payload)
        log(f"Login Status: {response.status_code}")
        log(f"Login Response: {response.text}")
    except Exception as e:
        log(f"Login Request Failed: {e}")

if __name__ == "__main__":
    new_user_id = test_signup()
    test_login(new_user_id)
