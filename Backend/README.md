# VivahSaathi — Complete Setup Guide

## Project Structure
```
Biodata maker/
├── backend/
│   ├── main.py              ← FastAPI server (MySQL + Razorpay)
│   ├── requirements.txt
│   └── .env.example         ← Copy to .env and fill values
└── frontend/
    ├── index.html           ← Landing page (your existing file)
    ├── create.html          ← NEW — complete biodata wizard
    ├── style.css            ← Your existing styles (unchanged)
    └── script.js            ← Your existing landing page JS (unchanged)
```

---

## Step 1 — Install dependencies


# Install all packages
pip install -r requirements.txt
```

---

## Step 2 — Set up .env

```powershell
# Create .env file from example
copy .env.example .env
notepad .env
````

---

## Step 3 — (Optional) Switch to MySQL

### 3a. Create MySQL database
```sql
CREATE DATABASE vivahsaathi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3b. Set DATABASE_URL in .env
```
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/vivahsaathi
```

Tables are created automatically on first run.

---

## Step 4 — Add your Razorpay keys

### In .env:
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=your_secret
```

### In frontend/create.html (line ~20):
```javascript
const RZP_KEY = 'rzp_test_YOUR_KEY';  // ← replace this
```

Get keys from: razorpay.com → Settings → API Keys

---

## Step 5 — Start the server

```powershell
cd "C:\Users\kunal\Desktop\Biodata maker\backend"
uvicorn main:app --reload --port 8000
```

Open: **http://localhost:8000**

---

## Features Checklist

### Templates (15 total)
| # | Name | Tier | Price |
|---|------|------|-------|
| 1 | Lotus White | Free | ₹0 |
| 2 | Simple Ivory | Free | ₹0 |
| 3 | Maroon Heritage | Paid | ₹21 |
| 4 | Royal Navy | Paid | ₹21 |
| 5 | Rose Blush | Paid | ₹21 |
| 6 | Forest Royale | Premium | ₹51 |
| 7 | Indigo Dreams | Premium | ₹51 |
| 8 | Teal Zenith | Premium | ₹51 |
| 9 | Saffron Glow | Premium | ₹51 |
| 10 | Pearl Mist | Premium | ₹51 |
| 11 | Maharaja Gold | Elite | ₹99 |
| 12 | Crimson Dynasty | Elite | ₹99 |
| 13 | Jasmine Queen | Elite | ₹99 |
| 14 | Velvet Midnight | Elite | ₹99 |
| 15 | Sacred Temple | Elite | ₹99 |

### Religious Symbols
- 14 preset symbols (ॐ, 🙏, 🪷, ✝️, ☪️, ☸️, 🔯, 🛕, 🌸, 🔱, 🪔, ✦, 👑, 🌙)
- Custom upload (Ganesha / deity image / any symbol)
- Live preview updates instantly

### Payment Flow
1. User selects paid template → payment modal opens
2. Razorpay checkout (UPI / Card / NetBanking)
3. Backend verifies HMAC signature
4. Download token saved in browser localStorage
5. Template permanently unlocked for that browser

### Download
- Opens print dialog → Save as PDF
- Works for all templates (free without payment, paid after payment)
- A4 format, print-quality typography
