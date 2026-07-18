from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import recommendation_routes
from app.routes import analytics_routes
from app.routes import stream_routes
from dotenv import load_dotenv
load_dotenv()

from app.database import Base, engine
from app.routes import (
    auth_routes,
    movie_routes,
    user_routes,
    watch_routes,
    payment_routes,
    admin_routes,
    upload_routes,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NovaPlay API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static/uploads", StaticFiles(directory="app/uploads"), name="uploads")

app.include_router(auth_routes.router)
app.include_router(movie_routes.router)
app.include_router(user_routes.router)
app.include_router(watch_routes.router)
app.include_router(payment_routes.router)
app.include_router(admin_routes.router)
app.include_router(upload_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(analytics_routes.router)
app.include_router(stream_routes.router)

@app.get("/")
def root():
    return {"message": "NovaPlay API is running"}