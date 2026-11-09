from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.core.migrate import run_migrations
from app.routers import auth, files, orders, products, seller, white_label
from app.seed import seed_database

app = FastAPI(
    title="Nexzoneo API",
    description="White-Label Local Marketplace Platform",
    version="1.0.0",
)

# Browsers reject allow_origins=["*"] when credentials are enabled.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "https://nexzoneo-demo-hub.netlify.app",
        "https://nexzoneo-seller-demo.netlify.app",
        "https://nexzoneo-app.netlify.app",
    ],
    allow_origin_regex=r"https://.*\.netlify\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(seller.router)
app.include_router(white_label.router)
app.include_router(files.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    run_migrations()
    seed_database()


@app.get("/health")
def health():
    db = settings.database_url.split("://")[0]
    return {"status": "ok", "app": "Nexzoneo", "database": db}
