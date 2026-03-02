import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Get DATABASE_URL from .env
DATABASE_URL = os.getenv("DATABASE_URL")
print("Using DATABASE_URL:", DATABASE_URL)

# Create engine
try:
    engine = create_engine(DATABASE_URL)
    # Try connecting
    connection = engine.connect()
    print("✅ Database connected successfully!")
    connection.close()
except Exception as e:
    print("❌ Database connection failed!")
    print(e)