# ═══════════════════════════════════════════
#   VivahSaathi — main.py  (Enhanced v2)
#   10 Templates · Razorpay · Confidential Fields
# ═══════════════════════════════════════════

import io, os, hmac, hashlib, secrets, time
from datetime import datetime
from typing import Optional, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from reportlab.lib import colors
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)

load_dotenv()

# ── Razorpay ─────────────────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

try:
    import razorpay as _rzp
    rzp_client    = _rzp.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    RZP_AVAILABLE = True
except ImportError:
    rzp_client    = None
    RZP_AVAILABLE = False

# ── Template Catalogue ────────────────────────────────────────────────────────
TEMPLATES = [
    {"id": 1,  "name": "Classic Ivory",   "price": 0,  "tier": "free",     "desc": "Timeless black & white",            "primary": "#2C2C2C", "accent": "#777777"},
    {"id": 2,  "name": "Warm Minimal",    "price": 0,  "tier": "free",     "desc": "Clean gray minimalist",             "primary": "#4A4A4A", "accent": "#AAAAAA"},
    {"id": 3,  "name": "Saffron Sunrise", "price": 21, "tier": "basic",    "desc": "Vibrant saffron & warm tones",      "primary": "#C85A00", "accent": "#F5A623"},
    {"id": 4,  "name": "Rose Garden",     "price": 21, "tier": "basic",    "desc": "Elegant rose & feminine accents",   "primary": "#AD1457", "accent": "#F48FB1"},
    {"id": 5,  "name": "Maroon Royal",    "price": 51, "tier": "standard", "desc": "Rich maroon with gold borders",     "primary": "#7B1C2E", "accent": "#D4A853"},
    {"id": 6,  "name": "Navy Prestige",   "price": 51, "tier": "standard", "desc": "Formal navy with gold accents",     "primary": "#1A3A5C", "accent": "#C9AA71"},
    {"id": 7,  "name": "Heritage Grand",  "price": 99, "tier": "premium",  "desc": "Ornate mandala-inspired luxury",    "primary": "#8B1A1A", "accent": "#D4A853"},
    {"id": 8,  "name": "Emerald Luxe",    "price": 99, "tier": "premium",  "desc": "Rich forest green with gold trim",  "primary": "#1A4A2E", "accent": "#B8973E"},
    {"id": 9,  "name": "Indigo Opulent",  "price": 99, "tier": "premium",  "desc": "Contemporary art-deco indigo",      "primary": "#1E0A5C", "accent": "#9B8EC9"},
    {"id": 10, "name": "Midnight Bloom",  "price": 99, "tier": "premium",  "desc": "Dramatic dark blue with rose gold", "primary": "#0F0A3D", "accent": "#B76E79"},
]
TPL_MAP = {t["id"]: t for t in TEMPLATES}

# ── In-Memory Payment Token Store ─────────────────────────────────────────────
_tokens: dict = {}  # token -> {template_id, expires}

def mint_token(template_id: int) -> str:
    tok = secrets.token_urlsafe(32)
    _tokens[tok] = {"template_id": template_id, "expires": time.time() + 3600}
    return tok

def check_token(tok: str, template_id: int) -> bool:
    d = _tokens.get(tok)
    if not d:                         return False
    if d["template_id"] != template_id: return False
    if time.time() > d["expires"]:
        _tokens.pop(tok, None);       return False
    return True

# ── App & CORS ────────────────────────────────────────────────────────────────
app = FastAPI(title="VivahSaathi API", version="2.0.0")

raw = os.getenv("ALLOWED_ORIGINS", "http://127.0.0.1:5500")
allowed = [o.strip() for o in raw.split(",")]
for x in ["http://127.0.0.1:5500", "http://localhost:5500"]:
    if x not in allowed: allowed.append(x)

app.add_middleware(
    CORSMiddleware, allow_origins=allowed,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# ── Request Schemas ───────────────────────────────────────────────────────────
class BiodataRequest(BaseModel):
    fullName:           Optional[str]       = ""
    dob:                Optional[str]       = ""
    pob:                Optional[str]       = ""
    height:             Optional[str]       = ""
    complexion:         Optional[str]       = ""
    religion:           Optional[str]       = ""
    caste:              Optional[str]       = ""
    subCaste:           Optional[str]       = ""
    manglik:            Optional[str]       = ""
    maritalStatus:      Optional[str]       = ""
    education:          Optional[str]       = ""
    college:            Optional[str]       = ""
    occupation:         Optional[str]       = ""
    company:            Optional[str]       = ""
    income:             Optional[str]       = ""
    fatherName:         Optional[str]       = ""
    fatherOcc:          Optional[str]       = ""
    motherName:         Optional[str]       = ""
    motherOcc:          Optional[str]       = ""
    brothers:           Optional[str]       = ""
    sisters:            Optional[str]       = ""
    familyType:         Optional[str]       = ""
    familyValues:       Optional[str]       = ""
    phone:              Optional[str]       = ""
    email:              Optional[str]       = ""
    address:            Optional[str]       = ""
    symbol:             Optional[str]       = "ॐ"
    template:           Optional[int]       = 1
    confidentialFields: Optional[List[str]] = []
    token:              Optional[str]       = ""

class OrderReq(BaseModel):
    template_id: int
    amount:      int   # paise

class VerifyReq(BaseModel):
    order_id:    str
    payment_id:  str
    signature:   str
    template_id: int

# ── Helpers ───────────────────────────────────────────────────────────────────
def fv(data: BiodataRequest, key: str, fallback: str = "—") -> tuple:
    """Returns (is_conf, display_string)"""
    if key in (data.confidentialFields or []):
        return (True, "Confidential")
    val = getattr(data, key, None)
    return (False, str(val).strip() if val else fallback)

def parse_dob(dob: str):
    try:
        bd  = datetime.strptime(dob, "%Y-%m-%d")
        age = (datetime.today() - bd).days // 365
        return bd.strftime("%d %B %Y"), f"{age} years"
    except:
        return dob or "—", "—"

# ═════════════════════════════════════════════════════════════════════════════
#  CANVAS BACKGROUND DRAWERS
# ═════════════════════════════════════════════════════════════════════════════
def draw_bg(canvas, W, H, tpl_id, primary, accent):

    if tpl_id == 1:                          # Classic Ivory — double border
        canvas.setStrokeColor(HexColor("#2C2C2C"))
        canvas.setLineWidth(1.5)
        canvas.rect(9*mm, 9*mm, W-18*mm, H-18*mm, stroke=1, fill=0)
        canvas.setLineWidth(0.4)
        canvas.rect(12*mm, 12*mm, W-24*mm, H-24*mm, stroke=1, fill=0)

    elif tpl_id == 2:                        # Warm Minimal — top gray bar
        canvas.setFillColor(HexColor("#EEEEEE"))
        canvas.rect(0, H-42*mm, W, 42*mm, stroke=0, fill=1)
        canvas.setStrokeColor(HexColor("#CCCCCC"))
        canvas.setLineWidth(1)
        canvas.rect(10*mm, 10*mm, W-20*mm, H-20*mm, stroke=1, fill=0)
        canvas.setStrokeColor(HexColor("#AAAAAA"))
        canvas.setLineWidth(2)
        canvas.line(10*mm, H-42*mm, W-10*mm, H-42*mm)

    elif tpl_id == 3:                        # Saffron Sunrise — full header
        canvas.setFillColor(HexColor("#C85A00"))
        canvas.rect(0, H-58*mm, W, 58*mm, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#F5A623"))
        canvas.rect(0, H-60*mm, W, 2*mm, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#C85A00"))
        canvas.rect(0, 0, W, 11*mm, stroke=0, fill=1)
        canvas.setStrokeColor(HexColor("#F5A623"))
        canvas.setLineWidth(1)
        canvas.line(10*mm, H-60*mm, 10*mm, 11*mm)
        canvas.line(W-10*mm, H-60*mm, W-10*mm, 11*mm)

    elif tpl_id == 4:                        # Rose Garden — pink header
        canvas.setFillColor(HexColor("#AD1457"))
        canvas.rect(0, H-58*mm, W, 58*mm, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#F48FB1"))
        canvas.rect(0, H-60*mm, W, 2*mm, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#AD1457"))
        canvas.rect(0, 0, W, 11*mm, stroke=0, fill=1)
        canvas.setStrokeColor(HexColor("#F48FB1"))
        canvas.setLineWidth(0.8)
        canvas.line(12*mm, H-62*mm, 12*mm, 11*mm)
        canvas.line(W-12*mm, H-62*mm, W-12*mm, 11*mm)

    elif tpl_id == 5:                        # Maroon Royal — header + gold border
        canvas.setFillColor(HexColor("#7B1C2E"))
        canvas.rect(0, H-65*mm, W, 65*mm, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#7B1C2E"))
        canvas.rect(0, 0, W, 10*mm, stroke=0, fill=1)
        canvas.setStrokeColor(HexColor("#D4A853"))
        canvas.setLineWidth(1.5)
        canvas.rect(7*mm, 7*mm, W-14*mm, H-14*mm, stroke=1, fill=0)
        canvas.setLineWidth(0.5)
        canvas.rect(10*mm, 10*mm, W-20*mm, H-20*mm, stroke=1, fill=0)
        # Left sidebar
        canvas.setFillColor(HexColor("#D4A853"))
        canvas.rect(7*mm, 10*mm, 2.5*mm, H-75*mm, stroke=0, fill=1)

    elif tpl_id == 6:                        # Navy Prestige — navy + gold
        canvas.setFillColor(HexColor("#1A3A5C"))
        canvas.rect(0, H-65*mm, W, 65*mm, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#1A3A5C"))
        canvas.rect(0, 0, W, 10*mm, stroke=0, fill=1)
        canvas.setStrokeColor(HexColor("#C9AA71"))
        canvas.setLineWidth(2)
        canvas.rect(7*mm, 7*mm, W-14*mm, H-14*mm, stroke=1, fill=0)
        canvas.setLineWidth(0.4)
        canvas.rect(10.5*mm, 10.5*mm, W-21*mm, H-21*mm, stroke=1, fill=0)
        # Gold header underline
        canvas.setLineWidth(2)
        canvas.line(12*mm, H-65*mm, W-12*mm, H-65*mm)
        canvas.line(12*mm, H-67*mm, W-12*mm, H-67*mm)

    elif tpl_id == 7:                        # Heritage Grand — ornate cream
        canvas.setFillColor(HexColor("#FFF8F0"))
        canvas.rect(0, 0, W, H, stroke=0, fill=1)
        # Outer border maroon
        canvas.setStrokeColor(HexColor("#8B1A1A"))
        canvas.setLineWidth(3)
        canvas.rect(8*mm, 8*mm, W-16*mm, H-16*mm, stroke=1, fill=0)
        # Inner border gold
        canvas.setStrokeColor(HexColor("#D4A853"))
        canvas.setLineWidth(0.8)
        canvas.rect(12*mm, 12*mm, W-24*mm, H-24*mm, stroke=1, fill=0)
        # Corner circles
        for cx, cy in [(8*mm,8*mm),(W-8*mm,8*mm),(8*mm,H-8*mm),(W-8*mm,H-8*mm)]:
            canvas.setFillColor(HexColor("#D4A853"))
            canvas.circle(cx, cy, 3.5*mm, stroke=0, fill=1)
            canvas.setStrokeColor(HexColor("#8B1A1A"))
            canvas.setLineWidth(0.8)
            canvas.circle(cx, cy, 3.5*mm, stroke=1, fill=0)
        # Header block
        canvas.setFillColor(HexColor("#8B1A1A"))
        canvas.rect(12*mm, H-72*mm, W-24*mm, 60*mm, stroke=0, fill=1)
        # Double gold underline
        canvas.setStrokeColor(HexColor("#D4A853"))
        canvas.setLineWidth(1.5)
        canvas.line(16*mm, H-73.5*mm, W-16*mm, H-73.5*mm)
        canvas.line(16*mm, H-75.5*mm, W-16*mm, H-75.5*mm)
        # Small ornament circles in header
        for cx in [28*mm, W-28*mm]:
            canvas.setStrokeColor(HexColor("#D4A853"))
            canvas.setLineWidth(0.8)
            canvas.circle(cx, H-55*mm, 5*mm, stroke=1, fill=0)
            canvas.circle(cx, H-55*mm, 2.5*mm, stroke=1, fill=0)
        # Footer
        canvas.setFillColor(HexColor("#8B1A1A"))
        canvas.rect(12*mm, 12*mm, W-24*mm, 9*mm, stroke=0, fill=1)

    elif tpl_id == 8:                        # Emerald Luxe — forest green
        canvas.setFillColor(HexColor("#1A4A2E"))
        canvas.rect(0, H-65*mm, W, 65*mm, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#1A4A2E"))
        canvas.rect(0, 0, W, 12*mm, stroke=0, fill=1)
        canvas.setStrokeColor(HexColor("#B8973E"))
        canvas.setLineWidth(2)
        canvas.rect(7*mm, 7*mm, W-14*mm, H-14*mm, stroke=1, fill=0)
        canvas.setLineWidth(0.4)
        canvas.rect(10*mm, 10*mm, W-20*mm, H-20*mm, stroke=1, fill=0)
        # Lateral bars
        canvas.setFillColor(HexColor("#2A6040"))
        canvas.rect(7*mm, 12*mm, 4*mm, H-77*mm, stroke=0, fill=1)
        canvas.rect(W-11*mm, 12*mm, 4*mm, H-77*mm, stroke=0, fill=1)
        # Corner accent squares
        for cx, cy in [(7*mm, H-65*mm), (W-11*mm, H-65*mm)]:
            canvas.setFillColor(HexColor("#B8973E"))
            canvas.rect(cx, cy, 4*mm, 4*mm, stroke=0, fill=1)

    elif tpl_id == 9:                        # Indigo Opulent — art deco
        canvas.setFillColor(HexColor("#F5F3FC"))
        canvas.rect(0, 0, W, H, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#1E0A5C"))
        canvas.rect(0, H-70*mm, W, 70*mm, stroke=0, fill=1)
        # Side panels
        canvas.setFillColor(HexColor("#2A1580"))
        canvas.rect(0, 0, 8*mm, H-70*mm, stroke=0, fill=1)
        canvas.rect(W-8*mm, 0, 8*mm, H-70*mm, stroke=0, fill=1)
        # Deco lines in header
        canvas.setStrokeColor(HexColor("#9B8EC9"))
        canvas.setLineWidth(1)
        canvas.line(20*mm, H-67*mm, W-20*mm, H-67*mm)
        canvas.line(20*mm, H-69.5*mm, W-20*mm, H-69.5*mm)
        # Content border
        canvas.setStrokeColor(HexColor("#1E0A5C"))
        canvas.setLineWidth(0.8)
        canvas.rect(8*mm, 0, W-16*mm, H-70*mm, stroke=1, fill=0)
        # Footer
        canvas.setFillColor(HexColor("#1E0A5C"))
        canvas.rect(0, 0, W, 10*mm, stroke=0, fill=1)
        # Accent dots on side panels
        canvas.setFillColor(HexColor("#9B8EC9"))
        for yy in range(int(20*mm), int(H-75*mm), int(25*mm)):
            canvas.circle(4*mm, yy, 1.5*mm, stroke=0, fill=1)
            canvas.circle(W-4*mm, yy, 1.5*mm, stroke=0, fill=1)

    else:                                    # Midnight Bloom — dark with rose gold
        canvas.setFillColor(HexColor("#F5F0FF"))
        canvas.rect(0, 0, W, H, stroke=0, fill=1)
        canvas.setFillColor(HexColor("#0F0A3D"))
        canvas.rect(0, H-68*mm, W, 68*mm, stroke=0, fill=1)
        # Rose gold header accent
        canvas.setStrokeColor(HexColor("#B76E79"))
        canvas.setLineWidth(2)
        canvas.line(12*mm, H-66*mm, W-12*mm, H-66*mm)
        # Corner flower ornaments
        for cx in [12*mm, W-12*mm]:
            cy = H-67*mm
            canvas.setFillColor(HexColor("#D4A0AA"))
            canvas.circle(cx, cy, 4*mm, stroke=0, fill=1)
            canvas.setStrokeColor(HexColor("#B76E79"))
            canvas.setLineWidth(0.6)
            canvas.circle(cx, cy, 4*mm, stroke=1, fill=0)
            canvas.circle(cx, cy, 2*mm, stroke=1, fill=0)
        # Content border
        canvas.setStrokeColor(HexColor("#B76E79"))
        canvas.setLineWidth(1.2)
        canvas.rect(10*mm, 10*mm, W-20*mm, H-78*mm, stroke=1, fill=0)
        # Footer
        canvas.setFillColor(HexColor("#0F0A3D"))
        canvas.rect(0, 0, W, 11*mm, stroke=0, fill=1)

def add_watermark(canvas, W, H):
    canvas.saveState()
    canvas.setFont("Helvetica-Bold", 52)
    canvas.setFillColor(Color(0.65, 0.65, 0.65, alpha=0.38))
    canvas.translate(W / 2, H / 2)
    canvas.rotate(42)
    canvas.drawCentredString(0, 40, "PREVIEW")
    canvas.setFont("Helvetica", 20)
    canvas.drawCentredString(0, -10, "VivahSaathi")
    canvas.drawCentredString(0, -35, "watermark")
    canvas.restoreState()

# ═════════════════════════════════════════════════════════════════════════════
#  PLATYPUS STORY BUILDER
# ═════════════════════════════════════════════════════════════════════════════
def ps(name, **kw):
    return ParagraphStyle(name, **kw)

def build_story(data: BiodataRequest, tpl: dict) -> list:
    primary   = HexColor(tpl["primary"])
    accent    = HexColor(tpl["accent"])
    tpl_id    = data.template or 1
    conf      = data.confidentialFields or []

    # Header text colour depends on light vs dark header
    light_header = tpl_id in [1, 2]
    h_text  = HexColor("#1A1A1A") if light_header else HexColor("#FFFFFF")
    h_sub   = HexColor("#555555") if light_header else HexColor("#E8D5A3") if tpl_id in [5,6,7,8] else HexColor("#C8B8F0")

    body    = HexColor("#1A1A1A")
    lbl_clr = HexColor("#666666")
    conf_cl = HexColor("#AAAAAA")

    W = A4[0] - 36 * mm  # usable width

    sym_s  = ps("Sym",  fontName="Helvetica-Bold", fontSize=26, textColor=h_text,  alignment=1, spaceAfter=1)
    name_s = ps("Nm",   fontName="Helvetica-Bold", fontSize=19, textColor=h_text,  alignment=1, spaceAfter=2)
    sub_s  = ps("Sub",  fontName="Helvetica",      fontSize=8,  textColor=h_sub,   alignment=1, spaceAfter=1)
    sec_s  = ps("Sec",  fontName="Helvetica-Bold", fontSize=9,  textColor=primary, spaceBefore=5, spaceAfter=2)
    lbl_s  = ps("Lbl",  fontName="Helvetica-Bold", fontSize=7.5, textColor=lbl_clr)
    val_s  = ps("Val",  fontName="Helvetica",      fontSize=8.5, textColor=body)
    conf_s = ps("Conf", fontName="Helvetica-Oblique", fontSize=8.5, textColor=conf_cl)
    foot_s = ps("Foot", fontName="Helvetica", fontSize=6.5, textColor=HexColor("#BBBBBB"), alignment=1)

    def make_val(is_conf, text):
        return Paragraph(text, conf_s if is_conf else val_s)

    def section(title):
        return [
            Spacer(1, 2*mm),
            Paragraph(f">>  {title}", sec_s),
            HRFlowable(width="100%", thickness=0.7, color=accent, spaceAfter=3, spaceBefore=1),
        ]

    def row2(l1, k1, l2, k2):
        """Two side-by-side label+value pairs"""
        v1 = fv(data, k1); v2 = fv(data, k2)
        return [Paragraph(l1, lbl_s), make_val(*v1), Paragraph(l2, lbl_s), make_val(*v2)]

    def table2(rows):
        t = Table(rows, colWidths=[W*0.17, W*0.33, W*0.17, W*0.33])
        t.setStyle(TableStyle([
            ("VALIGN",       (0,0), (-1,-1), "TOP"),
            ("BOTTOMPADDING",(0,0), (-1,-1), 3),
            ("TOPPADDING",   (0,0), (-1,-1), 2),
        ]))
        return t

    # ── Header spacing ──────────────────────────────────────────────
    # We use topMargin=12mm in doc for all templates.
    # Additional spacer here positions symbol within the header block.
    top_sp = {1:22, 2:12, 3:8, 4:8, 5:10, 6:10, 7:10, 8:10, 9:10, 10:10}
    # After header content, push body below the colored header rect
    gap_sp = {1:5,  2:5,  3:14, 4:14, 5:20, 6:20, 7:22, 8:18, 9:22, 10:18}

    # Map Unicode/emoji symbols → ASCII-safe for ReportLab built-in fonts
    SYMBOL_MAP = {
        'ॐ': 'OM', '🪔': '*', '✝': '+', '☪': 'C',
        '✡': '*', '☸': 'O', '🔱': 'Y', '🕊': '~',
    }
    raw_sym = data.symbol or 'ॐ'
    safe_sym = SYMBOL_MAP.get(raw_sym, raw_sym)
    # If still non-ASCII, fallback
    try:
        safe_sym.encode('latin-1')
    except (UnicodeEncodeError, UnicodeDecodeError):
        safe_sym = '~*~'

    story = [Spacer(1, top_sp.get(tpl_id, 10) * mm)]

    story.append(Paragraph(safe_sym, sym_s))
    story.append(Paragraph((data.fullName or "BIODATA").upper(), name_s))
    story.append(Paragraph("Marriage Biodata  ·  VivahSaathi", sub_s))
    story.append(Spacer(1, gap_sp.get(tpl_id, 12) * mm))

    # ── DOB special handling ──────────────────────────────────────
    if "dob" in conf:
        dob_d, age_d = "Confidential", "Confidential"
        dob_conf = age_conf = True
    else:
        dob_d, age_d = parse_dob(data.dob or "")
        dob_conf = age_conf = False

    # ── Personal ──────────────────────────────────────────────────
    story += section("Personal Details")
    story.append(table2([
        [Paragraph("Date of Birth", lbl_s), make_val(dob_conf, dob_d),
         Paragraph("Age", lbl_s),           make_val(age_conf, age_d)],
        row2("Place of Birth","pob",   "Height",     "height"),
        row2("Complexion",    "complexion","Marital Status","maritalStatus"),
        row2("Religion",      "religion", "Caste",    "caste"),
        row2("Sub-Caste/Gotra","subCaste","Manglik",  "manglik"),
    ]))

    # ── Professional ──────────────────────────────────────────────
    story += section("Education & Career")
    story.append(table2([
        row2("Education",    "education",  "College / University", "college"),
        row2("Occupation",   "occupation", "Company / Org",        "company"),
        [Paragraph("Annual Income", lbl_s), make_val(*fv(data,"income")),
         Paragraph("", lbl_s), Paragraph("", val_s)],
    ]))

    # ── Family ────────────────────────────────────────────────────
    story += section("Family Details")
    story.append(table2([
        row2("Father's Name", "fatherName", "Father's Occ.", "fatherOcc"),
        row2("Mother's Name", "motherName", "Mother's Occ.", "motherOcc"),
        row2("Brothers",      "brothers",   "Sisters",       "sisters"),
        row2("Family Type",   "familyType", "Family Values", "familyValues"),
    ]))

    # ── Contact ───────────────────────────────────────────────────
    story += section("Contact Details")
    story.append(table2([
        row2("Phone",   "phone",   "Email",   "email"),
        [Paragraph("Address", lbl_s), make_val(*fv(data,"address")),
         Paragraph("", lbl_s), Paragraph("", val_s)],
    ]))

    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width="100%", thickness=0.4, color=HexColor("#CCCCCC"), spaceAfter=3))
    story.append(Paragraph(f"Generated by VivahSaathi  ·  {tpl['name']} Template", foot_s))
    return story

# ═════════════════════════════════════════════════════════════════════════════
#  PDF GENERATOR
# ═════════════════════════════════════════════════════════════════════════════
def generate_pdf(data: BiodataRequest, watermark: bool = False) -> bytes:
    tpl_id  = data.template or 1
    tpl     = TPL_MAP.get(tpl_id, TPL_MAP[1])
    buffer  = io.BytesIO()

    def on_page(canvas, doc):
        W, H = doc.pagesize
        draw_bg(canvas, W, H, tpl_id, HexColor(tpl["primary"]), HexColor(tpl["accent"]))
        if watermark:
            add_watermark(canvas, W, H)

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=12*mm, bottomMargin=15*mm,
        leftMargin=18*mm, rightMargin=18*mm,
    )
    story = build_story(data, tpl)
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    buffer.seek(0)
    return buffer.read()

# ═════════════════════════════════════════════════════════════════════════════
#  ORIGINAL generate_biodata_pdf — KEPT EXACTLY AS-IS (used nowhere in v2)
# ═════════════════════════════════════════════════════════════════════════════
def generate_biodata_pdf(data) -> bytes:
    buffer = io.BytesIO()
    from reportlab.lib import colors as _c
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import HRFlowable as _HR

    TEMPLATE_PALETTES = {
        1: {"primary": _c.HexColor("#7a1c2e"), "accent": _c.HexColor("#c9956a"), "name": "Maroon Heritage"},
        2: {"primary": _c.HexColor("#1a2d4a"), "accent": _c.HexColor("#c9aa71"), "name": "Royal Navy"},
        3: {"primary": _c.HexColor("#a63d2f"), "accent": _c.HexColor("#e8a598"), "name": "Rose Blush"},
        4: {"primary": _c.HexColor("#1e4a2e"), "accent": _c.HexColor("#c9aa71"), "name": "Forest Royale"},
        5: {"primary": _c.HexColor("#2e1a6e"), "accent": _c.HexColor("#9b8ec9"), "name": "Indigo Dreams"},
        6: {"primary": _c.HexColor("#0d4a4a"), "accent": _c.HexColor("#4ecdc4"), "name": "Teal Zenith"},
    }
    palette  = TEMPLATE_PALETTES.get(data.template or 1, TEMPLATE_PALETTES[1])
    primary  = palette["primary"]
    accent   = palette["accent"]
    tpl_name = palette["name"]

    doc = SimpleDocTemplate(buffer, pagesize=A4,
        topMargin=15*mm, bottomMargin=15*mm, leftMargin=18*mm, rightMargin=18*mm)
    styles   = getSampleStyleSheet()
    W        = A4[0] - 36*mm

    def style(name, **kw): return ParagraphStyle(name, **kw)
    title_style    = style("Title2",   fontName="Helvetica-Bold", fontSize=22, textColor=primary, spaceAfter=2, alignment=1)
    subtitle_style = style("Sub",      fontName="Helvetica",      fontSize=9,  textColor=accent,  spaceAfter=4, alignment=1)
    section_style  = style("Section",  fontName="Helvetica-Bold", fontSize=10, textColor=primary, spaceBefore=8, spaceAfter=3)
    label_style    = style("Label",    fontName="Helvetica-Bold", fontSize=8,  textColor=_c.HexColor("#555555"))
    value_style    = style("Value",    fontName="Helvetica",      fontSize=9,  textColor=_c.HexColor("#222222"))

    def hr(c=None, w=1): return _HR(width="100%", thickness=w, color=c or primary, spaceAfter=4, spaceBefore=4)
    def section(title): return [Spacer(1,3*mm), Paragraph(f"◆  {title}", section_style), hr(accent, 0.5)]
    def field_table(rows):
        tdata = [[Paragraph(l, label_style), Paragraph(str(v) if v else "—", value_style)] for l, v in rows]
        t = Table(tdata, colWidths=[W*0.35, W*0.65])
        t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("BOTTOMPADDING",(0,0),(-1,-1),4),("TOPPADDING",(0,0),(-1,-1),2)]))
        return t
    def two_col_field_table(rows):
        tdata = [[Paragraph(r[0],label_style),Paragraph(str(r[1]) if r[1] else "—",value_style),Paragraph(r[2],label_style),Paragraph(str(r[3]) if r[3] else "—",value_style)] for r in rows]
        t = Table(tdata, colWidths=[W*0.18, W*0.30, W*0.18, W*0.34])
        t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("BOTTOMPADDING",(0,0),(-1,-1),4),("TOPPADDING",(0,0),(-1,-1),2)]))
        return t

    dob_display = data.dob or ""
    age_display = ""
    if dob_display:
        try:
            bd = datetime.strptime(dob_display, "%Y-%m-%d")
            age = (datetime.today() - bd).days // 365
            dob_display = bd.strftime("%d %B %Y")
            age_display = f"{age} years"
        except: pass

    story = []
    story.append(Paragraph(data.symbol or "ॐ", style("Sym", fontName="Helvetica", fontSize=24, textColor=primary, alignment=1, spaceAfter=2)))
    story.append(Paragraph(data.fullName.upper() if data.fullName else "BIODATA", title_style))
    story.append(Paragraph("Marriage Biodata", subtitle_style))
    story.append(hr(primary, 1.5)); story.append(Spacer(1, 2*mm))
    story += section("Personal Details")
    story.append(two_col_field_table([
        ("Date of Birth", dob_display, "Age", age_display),
        ("Place of Birth", data.pob, "Height", data.height),
        ("Complexion", data.complexion, "Marital Status", data.maritalStatus),
        ("Religion", data.religion, "Caste", data.caste),
        ("Sub-Caste/Gotra", data.subCaste, "Manglik", data.manglik),
    ]))
    story += section("Education & Career")
    story.append(two_col_field_table([
        ("Education", data.education, "College/University", data.college),
        ("Occupation", data.occupation, "Company", data.company),
        ("Annual Income", data.income, "", ""),
    ]))
    story += section("Family Details")
    story.append(two_col_field_table([
        ("Father's Name", data.fatherName, "Father's Occupation", data.fatherOcc),
        ("Mother's Name", data.motherName, "Mother's Occupation", data.motherOcc),
        ("Brothers", data.brothers, "Sisters", data.sisters),
        ("Family Type", data.familyType, "Family Values", data.familyValues),
    ]))
    story += section("Contact Details")
    story.append(two_col_field_table([
        ("Phone", data.phone, "Email", data.email),
        ("Address", data.address, "", ""),
    ]))
    story.append(Spacer(1, 5*mm)); story.append(hr(primary, 1))
    story.append(Paragraph(f"Generated by VivahSaathi · {tpl_name} Template", style("Footer", fontName="Helvetica", fontSize=7, textColor=_c.HexColor("#aaaaaa"), alignment=1)))
    doc.build(story)
    buffer.seek(0)
    return buffer.read()

# ═════════════════════════════════════════════════════════════════════════════
#  API ROUTES
# ═════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"status": "VivahSaathi API is running 🎉", "version": "2.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/templates")
def get_templates():
    return {"templates": TEMPLATES}

@app.post("/preview")
async def preview_biodata(data: BiodataRequest):
    """Returns a watermarked PDF for paid templates, clean for free."""
    tpl_id   = data.template or 1
    tpl      = TPL_MAP.get(tpl_id, TPL_MAP[1])
    is_paid  = tpl["price"] > 0
    try:
        pdf = generate_pdf(data, watermark=is_paid)
        name = f"Preview_{tpl['name'].replace(' ','_')}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf), media_type="application/pdf",
            headers={"Content-Disposition": f'inline; filename="{name}"'},
        )
    except Exception as e:
        raise HTTPException(500, f"Preview generation failed: {e}")

@app.post("/create-order")
async def create_order(req: OrderReq):
    """Create Razorpay order for a paid template."""
    tpl = TPL_MAP.get(req.template_id)
    if not tpl:
        raise HTTPException(400, "Invalid template ID")
    if tpl["price"] == 0:
        raise HTTPException(400, "This template is free — no payment needed")
    expected_amount = tpl["price"] * 100  # paise
    if req.amount != expected_amount:
        raise HTTPException(400, "Amount mismatch")
    if not RZP_AVAILABLE:
        raise HTTPException(500, "Razorpay not installed. Run: pip install razorpay")
    if not RAZORPAY_KEY_ID or RAZORPAY_KEY_ID.startswith("rzp_test_XXXX"):
        raise HTTPException(500, "Razorpay keys not configured in .env")
    try:
        order = rzp_client.order.create({
            "amount":   expected_amount,
            "currency": "INR",
            "notes":    {"template_id": str(req.template_id), "template_name": tpl["name"]},
        })
        return {
            "order_id":   order["id"],
            "amount":     expected_amount,
            "currency":   "INR",
            "key_id":     RAZORPAY_KEY_ID,
            "template_id": req.template_id,
        }
    except Exception as e:
        raise HTTPException(500, f"Razorpay error: {e}")

@app.post("/verify-payment")
async def verify_payment(req: VerifyReq):
    """Verify Razorpay HMAC signature, return a download token."""
    secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if not secret:
        raise HTTPException(500, "RAZORPAY_KEY_SECRET not set in .env")
    msg      = f"{req.order_id}|{req.payment_id}".encode()
    expected = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, req.signature):
        raise HTTPException(400, "Payment verification failed — invalid signature")
    token = mint_token(req.template_id)
    return {"status": "success", "token": token, "template_id": req.template_id}

@app.post("/download")
async def download_biodata(data: BiodataRequest):
    """
    Free templates: download directly.
    Paid templates: require a valid token from /verify-payment.
    """
    tpl_id = data.template or 1
    tpl    = TPL_MAP.get(tpl_id, TPL_MAP[1])

    if tpl["price"] > 0:
        token = (data.token or "").strip()
        if not token:
            raise HTTPException(403, "Payment required. Complete payment to download this template.")
        if not check_token(token, tpl_id):
            raise HTTPException(403, "Invalid or expired token. Please complete payment again.")

    try:
        pdf  = generate_pdf(data, watermark=False)
        name = f"Biodata_{(data.fullName or 'VivahSaathi').replace(' ','_')}.pdf"
        return StreamingResponse(
            io.BytesIO(pdf), media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{name}"'},
        )
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {e}")