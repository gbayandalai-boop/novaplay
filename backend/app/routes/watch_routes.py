from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

router = APIRouter(prefix="/api/watch", tags=["Watch"])


@router.get("/continue")
def continue_watching(user_id: int = 1, db: Session = Depends(get_db)):
    rows = (
        db.query(models.WatchHistory, models.Movie)
        .join(models.Movie, models.WatchHistory.movie_id == models.Movie.id)
        .filter(models.WatchHistory.user_id == user_id)
        .filter(models.WatchHistory.progress > 0)
        .order_by(models.WatchHistory.watched_at.desc())
        .all()
    )

    result = []

    for history, movie in rows:
        result.append({
            "id": movie.id,
            "title": movie.title,
            "poster_url": movie.poster_url,
            "video_url": movie.video_url,
            "genre": movie.genre,
            "progress": history.progress
        })

    return result


@router.get("/{movie_id}")
def watch_movie(movie_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()

    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    history = db.query(models.WatchHistory).filter(
        models.WatchHistory.user_id == user_id,
        models.WatchHistory.movie_id == movie_id
    ).first()

    return {
        "movie_id": movie.id,
        "id": movie.id,
        "title": movie.title,
        "poster_url": movie.poster_url,
        "video_url": movie.video_url,
        "progress": history.progress if history else 0
    }


@router.put("/{movie_id}/progress")
def update_watch_progress(
    movie_id: int,
    user_id: int,
    progress: int,
    db: Session = Depends(get_db)
):
    history = db.query(models.WatchHistory).filter(
        models.WatchHistory.user_id == user_id,
        models.WatchHistory.movie_id == movie_id
    ).first()

    if history:
        history.progress = progress
    else:
        history = models.WatchHistory(
            user_id=user_id,
            movie_id=movie_id,
            progress=progress
        )
        db.add(history)

    db.commit()
    db.refresh(history)

    return {
        "message": "Progress updated",
        "progress": history.progress
    }