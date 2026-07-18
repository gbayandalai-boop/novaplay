from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models
from app.auth import require_admin

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/summary")
def analytics_summary(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    total_users = db.query(models.User).count()
    premium_users = db.query(models.User).filter(models.User.is_subscribed == True).count()
    total_movies = db.query(models.Movie).count()
    total_watch_events = db.query(models.WatchHistory).count()
    total_favorites = db.query(models.Favorite).count()

    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "free_users": total_users - premium_users,
        "total_movies": total_movies,
        "total_watch_events": total_watch_events,
        "total_favorites": total_favorites
    }


@router.get("/top-movies")
def top_movies(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    rows = (
        db.query(
            models.Movie.id,
            models.Movie.title,
            models.Movie.poster_url,
            func.count(models.WatchHistory.id).label("views")
        )
        .join(models.WatchHistory, models.WatchHistory.movie_id == models.Movie.id)
        .group_by(models.Movie.id)
        .order_by(func.count(models.WatchHistory.id).desc())
        .limit(10)
        .all()
    )

    return [
        {
            "id": r.id,
            "title": r.title,
            "poster_url": r.poster_url,
            "views": r.views
        }
        for r in rows
    ]


@router.get("/recommendation-performance")
def recommendation_performance(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    total_watch = db.query(models.WatchHistory).count()
    total_fav = db.query(models.Favorite).count()

    score = 0
    if total_watch > 0:
      score = round((total_fav / total_watch) * 100, 2)

    return {
        "watch_events": total_watch,
        "favorites": total_fav,
        "engagement_score": score
    }

@router.get("/admin")
def admin_analytics_alias(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    total_users = db.query(models.User).count()
    premium_users = db.query(models.User).filter(models.User.is_subscribed == True).count()
    total_movies = db.query(models.Movie).count()
    total_watch_events = db.query(models.WatchHistory).count()
    total_favorites = db.query(models.Favorite).count()

    return {
        "total_users": total_users,
        "premium_users": premium_users,
        "free_users": total_users - premium_users,
        "total_movies": total_movies,
        "total_watch_events": total_watch_events,
        "total_favorites": total_favorites
    }