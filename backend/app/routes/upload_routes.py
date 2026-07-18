import os
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.auth import require_admin
from app import models

router = APIRouter(prefix="/api/upload", tags=["Upload"])

POSTER_DIR = "app/uploads/posters"
VIDEO_DIR = "app/uploads/videos"

os.makedirs(POSTER_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)


def save_file(file: UploadFile, folder: str, allowed_types: list[str]):
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")

    safe_name = file.filename.replace(" ", "_")
    file_path = os.path.join(folder, safe_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path.replace("app/", "/static/")


@router.post("/poster")
def upload_poster(
    file: UploadFile = File(...),
    admin_user: models.User = Depends(require_admin)
):
    url = save_file(
        file,
        POSTER_DIR,
        ["image/jpeg", "image/png", "image/webp"]
    )
    return {"url": url}


@router.post("/video")
def upload_video(
    file: UploadFile = File(...),
    admin_user: models.User = Depends(require_admin)
):
    url = save_file(
        file,
        VIDEO_DIR,
        ["video/mp4", "video/webm"]
    )
    return {"url": url}