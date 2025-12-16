from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

try:
    hash = pwd_context.hash("testpassword")
    print(f"Hashing successful: {hash}")
    print(f"Verify: {pwd_context.verify('testpassword', hash)}")
except Exception as e:
    print(f"Error: {e}")
