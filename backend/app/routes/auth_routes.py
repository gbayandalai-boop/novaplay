from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

import random
import secrets
import smtplib
import os
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.database import get_db
from app import models, schemas
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


def send_html_email(to_email: str, subject: str, html: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = os.getenv("SMTP_EMAIL")
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(os.getenv("SMTP_EMAIL"), os.getenv("SMTP_PASSWORD"))
        server.send_message(msg)


def send_verification_email(user, db: Session):
    db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.user_id == user.id
    ).delete()

    token = secrets.token_urlsafe(32)

    verify = models.EmailVerificationToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=1),
    )

    db.add(verify)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    verify_link = f"{frontend_url}/verify/{token}"

    html = f"""
    <html>
      <body style="font-family: Arial; background:#0b0b0b; padding:20px; color:#fff;">
        <div style="max-width:500px; margin:auto; background:#111; padding:30px; border-radius:16px; text-align:center;">
          <img src="https://yourdomain.com/logo.png"
               alt="NovaPlay"
               style="width:120px; margin-bottom:20px;" />

          <h2>Verify your email</h2>

          <p style="color:#ccc;">
            NovaPlay бүртгэлээ баталгаажуулна уу.
          </p>

          <div style="margin:30px 0;">
            <a href="{verify_link}"
               style="background:#e50914; color:#fff; padding:14px 28px;
                      text-decoration:none; border-radius:8px; font-weight:bold;">
              Verify Account
            </a>
          </div>

          <p style="color:#888; font-size:12px;">
            Энэ линк 1 цаг хүчинтэй.
          </p>
        </div>
      </body>
    </html>
    """

    send_html_email(
        to_email=user.email,
        subject="NovaPlay Email Verification",
        html=html,
    )


@router.post("/login")
def login(data: schemas.LoginSchema, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_verified and user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please check your inbox or resend verification.",
        )

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
    }


@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()

    if existing:
        if not existing.is_verified:
            send_verification_email(existing, db)
            return {
                "message": "Email already registered but not verified. Verification email sent again.",
                "user_id": existing.id,
            }

        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role="user",
        is_subscribed=False,
        is_verified=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_verification_email(new_user, db)

    return {
        "message": "User registered successfully. Please verify your email.",
        "user_id": new_user.id,
    }


@router.post("/resend-verification")
def resend_verification(data: schemas.ForgotPasswordSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        return {"message": "If email exists, verification email sent"}

    if user.is_verified:
        return {"message": "Email already verified"}

    send_verification_email(user, db)

    return {"message": "Verification email sent"}


@router.get("/verify/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    record = db.query(models.EmailVerificationToken).filter(
        models.EmailVerificationToken.token == token
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid token")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification token expired")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True

    db.delete(record)
    db.commit()

    return {"message": "Email verified successfully"}


@router.get("/me")
def me(current_user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_verified": user.is_verified,
        "is_subscribed": user.is_subscribed,
    }


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPasswordSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        return {"message": "If email exists, reset link sent"}

    token = secrets.token_urlsafe(32)

    reset = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        used=False,
    )

    db.add(reset)
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_url}/reset-password/{token}"

    html = f"""
    <html>
      <body style="font-family: Arial; background:#0b0b0b; padding:20px; color:#fff;">
        <div style="max-width:500px; margin:auto; background:#111; padding:30px; border-radius:16px; text-align:center;">
          <img src="https://yourdomain.com/logo.png" 
               alt="NovaPlay"
               style="width:120px; margin-bottom:20px;" />

          <h2>Password Reset</h2>

          <p style="color:#ccc;">
            Та нууц үгээ шинэчлэх хүсэлт илгээсэн байна.
          </p>

          <div style="margin:30px 0;">
            <a href="{reset_link}" 
               style="background:#e50914; color:#fff; padding:14px 28px; 
                      text-decoration:none; border-radius:8px; font-weight:bold;">
              Reset Password
            </a>
          </div>

          <p style="color:#888; font-size:12px;">
            Энэ линк 15 минут хүчинтэй.
          </p>
        </div>
      </body>
    </html>
    """

    send_html_email(
        to_email=user.email,
        subject="NovaPlay Password Reset",
        html=html,
    )

    return {"message": "If email exists, reset link sent"}


@router.post("/reset-password")
def reset_password(data: schemas.ResetPasswordSchema, db: Session = Depends(get_db)):
    reset = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == data.token,
        models.PasswordResetToken.used == False,
    ).first()

    if not reset:
        raise HTTPException(status_code=400, detail="Invalid token")

    if reset.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")

    user = db.query(models.User).filter(models.User.id == reset.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    reset.used = True

    db.commit()

    return {"message": "Password changed successfully"}


@router.post("/send-otp")
def send_otp(data: schemas.ForgotPasswordSchema, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user:
        return {"message": "If email exists, OTP sent"}

    otp = str(random.randint(100000, 999999))

    record = models.PasswordResetOTP(
        user_id=user.id,
        otp_code=otp,
        expires_at=datetime.utcnow() + timedelta(minutes=5),
        used=False,
    )

    db.add(record)
    db.commit()

    html = f"""
    <div style="font-family:Arial;background:#111;padding:20px;color:#fff;text-align:center;">
        <h2 style="color:#e50914;">NovaPlay</h2>
        <h3>Password Reset Code</h3>
        <h1 style="letter-spacing:6px;">{otp}</h1>
        <p>5 минутын дотор ашиглана уу</p>
    </div>
    """

    send_html_email(
        to_email=user.email,
        subject="Your OTP Code",
        html=html,
    )

    return {"message": "OTP sent"}


@router.post("/verify-otp")
def verify_otp(data: schemas.ResetPasswordSchema, db: Session = Depends(get_db)):
    record = db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.otp_code == data.token,
        models.PasswordResetOTP.used == False,
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(data.new_password)
    record.used = True

    db.commit()

    return {"message": "Password updated"}