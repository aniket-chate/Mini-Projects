import os

# Database Settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "venu369")
DB_NAME = os.getenv("DB_NAME", "hotel_management")
DB_PORT = int(os.getenv("DB_PORT", "3306"))

# Security Settings
SECRET_KEY = os.getenv("SECRET_KEY", "hotel-ai-futuristic-super-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# AI Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
