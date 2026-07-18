from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/user", tags=["User"])


@router.get("/profile")
def profile(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == current_user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_subscribed": user.is_subscribed
    }

@router.get("/history")
def watch_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(models.WatchHistory, models.Movie)
        .join(models.Movie, models.WatchHistory.movie_id == models.Movie.id)
        .filter(models.WatchHistory.user_id == current_user.id)
        .order_by(models.WatchHistory.watched_at.desc())
        .all()
    )

    return [
        {
            "id": movie.id,
            "title": movie.title,
            "poster_url": movie.poster_url,
            "progress": history.progress
        }
        for history, movie in rows
    ]


@router.get("/favorites")
def favorites(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(models.Favorite, models.Movie)
        .join(models.Movie, models.Favorite.movie_id == models.Movie.id)
        .filter(models.Favorite.user_id == current_user.id)
        .all()
    )

    return [
        {
            "id": movie.id,
            "title": movie.title,
            "poster_url": movie.poster_url
        }
        for _, movie in rows
    ]


@router.post("/favorite/{movie_id}")
def add_favorite(movie_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.movie_id == movie_id
    ).first()

    if not exists:
        fav = models.Favorite(user_id=current_user.id, movie_id=movie_id)
        db.add(fav)
        db.commit()

    return {"message": "Added to favorites"}
@router.get("/sessions")
def get_sessions(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user.id,
        models.UserSession.is_active == True
    ).all()

    return [
        {
            "id": s.id,
            "device": s.device,
            "ip": s.ip,
            "last_active": s.last_active
        }
        for s in sessions
    ]


@router.post("/sessions/{session_id}/revoke")
def revoke_session(session_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.query(models.UserSession).filter(
        models.UserSession.id == session_id,
        models.UserSession.user_id == current_user.id
    ).first()

    if session:
        session.is_active = False
        db.commit()

    return {"message": "Session revoked"}


@router.post("/sessions/logout-all")
def logout_all(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user.id
    ).update({"is_active": False})

    db.commit()

    return {"message": "Logged out from all devices"}