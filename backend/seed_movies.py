from app.database import SessionLocal
from app import models
import random

db = SessionLocal()

genres = [
    "Action",
    "Drama",
    "Comedy",
    "Sci-Fi",
    "Horror",
    "Romance",
    "Thriller",
    "Adventure",
]

titles = [
    "Shadow Empire",
    "Dark Mission",
    "Lost Galaxy",
    "Silent War",
    "Red Horizon",
    "Night Hunter",
    "Ocean Fire",
    "Final Code",
    "Broken City",
    "Iron Legacy",
]

for i in range(1, 501):
    movie = models.Movie(
        title=f"{random.choice(titles)} {i}",
        description=f"This is demo movie number {i}.",
        genre=random.choice(genres),
        poster_url=f"https://picsum.photos/300/450?random={i}",
        video_url="",
        release_year=random.randint(1995, 2025),
        rating=round(random.uniform(5.0, 9.8), 1),
    )

    db.add(movie)

db.commit()
db.close()

print("✅ 500 movies seeded successfully")