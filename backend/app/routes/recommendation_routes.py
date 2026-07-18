from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.ml.recommender import build_matrix, recommend

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


def score(movie, user_genres, watched_ids):
    s = 0

    # 🎯 genre match
    if movie.genre in user_genres:
        s += 5

    # ⭐ rating
    if movie.rating:
        s += movie.rating

    # 🆕 шинэ кино
    if movie.created_at:
        s += 1

    # ❌ already watched penalize
    if movie.id in watched_ids:
        s -= 10

    # 💎 premium boost
    if movie.is_premium:
        s += 1

    return s


@router.get("/ml/{user_id}")
def ml_recommend(user_id: int, db: Session = Depends(get_db)):
    # 🎬 watch history
    history = db.query(models.WatchHistory).filter(
        models.WatchHistory.user_id == user_id
    ).all()

    watched_ids = [h.movie_id for h in history]

    watched_movies = db.query(models.Movie).filter(
        models.Movie.id.in_(watched_ids)
    ).all()

    # 🎯 хэрэглэгчийн genre profile
    user_genres = [m.genre for m in watched_movies if m.genre]

    # 🎬 бүх кино
    movies = db.query(models.Movie).all()

    scored = []
    for m in movies:
        s = score(m, user_genres, watched_ids)
        scored.append((s, m))

    scored.sort(reverse=True, key=lambda x: x[0])

    result = [m for _, m in scored if m.id not in watched_ids]

    return result[:12]
@router.get("/cf/{user_id}")
def collaborative(user_id: int, db: Session = Depends(get_db)):
    history = db.query(models.WatchHistory).all()
    movies = db.query(models.Movie).all()

    matrix, user_index, movie_index = build_matrix([], movies, history)

    recs = recommend(user_id, matrix, user_index, movie_index, movies)

    return recs
@router.post("/event")
def user_event(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    movie_id = data.get("movie_id")
    action = data.get("action")  # click / watch

    # simple: watch history дээр хадгална
    history = models.WatchHistory(
        user_id=user_id,
        movie_id=movie_id,
        progress=1
    )

    db.add(history)
    db.commit()

    return {"status": "ok"}
@router.get("/realtime/{user_id}")
def realtime(user_id: int, db: Session = Depends(get_db)):
    history = db.query(models.WatchHistory).filter(
        models.WatchHistory.user_id == user_id
    ).order_by(models.WatchHistory.watched_at.desc()).limit(5).all()

    last_ids = [h.movie_id for h in history]

    movies = db.query(models.Movie).all()

    # 🔥 хамгийн сүүлд үзсэн genre дээр суурилна
    last_movies = db.query(models.Movie).filter(models.Movie.id.in_(last_ids)).all()
    genres = [m.genre for m in last_movies if m.genre]

    result = []

    for m in movies:
        score = 0

        if m.genre in genres:
            score += 5

        if m.is_premium:
            score += 1

        if m.rating:
            score += m.rating

        result.append((score, m))

    result.sort(reverse=True, key=lambda x: x[0])

    return [m for _, m in result[:10]]