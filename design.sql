CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    ID VARCHAR(50) NOT NULL UNIQUE,
    PW VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    nickname VARCHAR(50) NULL,
    phone_num VARCHAR(20) NULL,  -- <-- 여기가 핵심! 이제 문자도 들어갑니다.
    created_at DATETIME DEFAULT NOW()
);