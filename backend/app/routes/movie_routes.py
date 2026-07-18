from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi import APIRouter, Depends
from app.database import SessionLocal
from app import models
from app.auth import require_admin

router = APIRouter(prefix="/api/movies", tags=["Movies"])


@router.post("")
def create_movie(data: dict, admin=Depends(require_admin)):
    db = SessionLocal()

    movie = models.Movie(
        title=data["title"],
        description=data["description"],
        genre=data["genre"],
        poster_url=data["poster_url"],
        video_url=data["video_url"],
    )

    db.add(movie)
    db.commit()
    db.refresh(movie)

    return movie


@router.get("/")
def get_movies():
    db = SessionLocal()
    return db.query(models.Movie).all()

@router.get("/{movie_id}")
def get_movie(movie_id: int):
    db = SessionLocal()
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()

    if not movie:
        return {"error": "Movie not found"}

    return movie

@router.get("/")
def get_movies(db: Session = Depends(get_db)):
    return db.query(models.Movie).all()


@router.get("/{movie_id}")
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()

    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    return movie