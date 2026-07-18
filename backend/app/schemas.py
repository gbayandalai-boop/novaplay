from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


# ✅ НЭМЭГДСЭН
class LoginSchema(BaseModel):
    email: str
    password: str


class MovieCreate(BaseModel):
    title: str
    description: Optional[str] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    video_url: Optional[str] = None
    trailer_url: Optional[str] = None
    release_year: Optional[int] = None
    duration: Optional[int] = None
    rating: Optional[float] = 0
    category_id: Optional[int] = None


class CategoryCreate(BaseModel):
    name: str

class ForgotPasswordSchema(BaseModel):
    email: str


class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    token: str
    new_password: str