from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional, List
from backend.database import get_db_connection, hash_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

STAFF_PASSCODE = "HOTEL-GRAND-2026"

class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "guest"
    passcode: Optional[str] = None


@router.post("/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        hashed = hash_password(req.password)
        cursor.execute("SELECT id, username, role, created_at FROM users WHERE username = %s AND password = %s", 
                       (req.username, hashed))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        token = f"token-{user['id']}-{user['username']}-{user['role']}"
        return {
            "success": True,
            "message": f"Welcome back, {user['username']} ({user['role'].upper()})",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "role": user.get("role", "guest"),
                "created_at": str(user.get("created_at", ""))
            },
            "token": token,
            "session_token": token
        }
    finally:
        cursor.close()
        conn.close()


@router.post("/signup")
def signup(req: SignupRequest):
    uname = req.username.strip()
    pword = req.password.strip()
    requested_role = (req.role or "guest").lower().strip()

    if len(uname) < 3 or len(pword) < 6:
        raise HTTPException(status_code=400, detail="Username min 3 chars, password min 6 chars")

    if requested_role not in ["guest", "staff", "manager"]:
        raise HTTPException(status_code=400, detail="Invalid role. Supported: guest, staff, manager")

    # Staff or Manager registration requires security passcode
    if requested_role in ["staff", "manager"]:
        if not req.passcode or req.passcode.strip() != STAFF_PASSCODE:
            raise HTTPException(
                status_code=403, 
                detail="Administrative security passcode required for staff or manager registration."
            )

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE username = %s", (uname,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")

        hashed = hash_password(pword)
        cursor.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                       (uname, hashed, requested_role))
        new_id = cursor.lastrowid
        conn.commit()

        token = f"token-{new_id}-{uname}-{requested_role}"
        return {
            "success": True,
            "message": f"{requested_role.capitalize()} account created successfully!",
            "user": {
                "id": new_id,
                "username": uname,
                "role": requested_role
            },
            "token": token,
            "session_token": token
        }
    finally:
        cursor.close()
        conn.close()


@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None)):
    """Validate current session token and return user details."""
    if not authorization:
        return {"authenticated": False, "user": None}

    token = authorization.replace("Bearer ", "").strip()
    parts = token.split("-")
    if len(parts) < 3:
        return {"authenticated": False, "user": None}

    user_id = parts[1]
    conn = get_db_connection()
    if not conn:
        return {"authenticated": False, "user": None}

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, role, created_at FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if user:
            return {
                "authenticated": True,
                "user": {
                    "id": user["id"],
                    "username": user["username"],
                    "role": user["role"],
                    "created_at": str(user["created_at"])
                }
            }
        return {"authenticated": False, "user": None}
    finally:
        cursor.close()
        conn.close()


@router.get("/users")
def list_system_users():
    """List staff and guest accounts (for administration)."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, role, created_at FROM users ORDER BY role, id ASC")
        return {"success": True, "users": cursor.fetchall()}
    finally:
        cursor.close()
        conn.close()
