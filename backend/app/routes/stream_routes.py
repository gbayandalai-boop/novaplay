import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

router = APIRouter(prefix="/api/stream", tags=["Stream"])


@router.get("/movie/{movie_id}")
def stream_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()

    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    if not movie.video_url:
        raise HTTPException(status_code=404, detail="Video not found")

    video_path = movie.video_url

    if video_path.startswith("http"):
        raise HTTPException(status_code=400, detail="External video URL cannot stream as file")

    if video_path.startswith("/"):
        video_path = video_path[1:]

    full_path = os.path.join(os.getcwd(), video_path)

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail=f"Video file not found: {full_path}")

    return FileResponse(
        full_path,
        media_type="video/mp4",
        filename=os.path.basename(full_path)
    )