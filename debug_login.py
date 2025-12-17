import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_login():
    url = f"{BASE_URL}/users/login"
    payload = {"ID": "testuser", "PW": "password123"}
    headers = {"Content-Type": "application/json"}
    
    print(f"Attempting Login to {url} with {payload}...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request Failed: {e}")

def test_signup():
    url = f"{BASE_URL}/users/signup"
    payload = {
        "ID": "testuser", 
        "PW": "password123", 
        "name": "Test User", 
        "nickname": "Tester", 
        "district_code": "2611000000",
        "phone_num": "010-0000-0000"
    }
    headers = {"Content-Type": "application/json"}
    
    print(f"\nAttempting Signup to {url}...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Request Failed: {e}")

if __name__ == "__main__":
    test_signup()
    test_login()
