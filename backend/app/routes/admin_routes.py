from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/movies")
def admin_movies(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin)
):
    return db.query(models.Movie).all()

@router.post("/refresh")
def refresh_token(data: dict):
    token = data.get("refresh_token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401)

        user_id = int(payload.get("sub"))

        new_access = create_access_token(user_id)

        return {"access_token": new_access}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/movies")
def create_movie(
    movie: schemas.MovieCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin)
):
    new_movie = models.Movie(**movie.dict())

    db.add(new_movie)
    db.commit()
    db.refresh(new_movie)

    return {"message": "Movie created successfully", "movie": new_movie}


@router.delete("/movies/{movie_id}")
def delete_movie(
    movie_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin)
):
    movie = db.query(models.Movie).filter(models.Movie.id == movie_id).first()

    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    db.delete(movie)
    db.commit()

    return {"message": "Movie deleted successfully"}


@router.post("/categories")
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin)
):
    new_category = models.Category(name=category.name)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category