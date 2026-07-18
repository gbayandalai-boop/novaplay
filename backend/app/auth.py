from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import hashlib

# ✅ НЭМЭГДСЭН
import os
import time
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

from app.database import get_db
from app import models

SECRET_KEY = os.getenv("SECRET_KEY", "secret")
ALGO = "HS256"

ACCESS_EXPIRE = 60 * 15
REFRESH_EXPIRE = 60 * 60 * 24 * 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, password_hash: str):
    return hashlib.sha256(password.encode()).hexdigest() == password_hash


def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": int(time.time()) + ACCESS_EXPIRE,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGO)


def create_refresh_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": int(time.time()) + REFRESH_EXPIRE,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGO)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_admin(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return user