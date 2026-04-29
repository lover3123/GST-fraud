from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.gstin import router as gstin_router
from app.routers.health import router as health_router
from app.routers.invoices import router as invoices_router
from app.routers.admin import router as admin_router
from app import models  # noqa: F401


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)

    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://0.0.0.0:3000",
        "http://0.0.0.0:3001",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, tags=["health"])
    app.include_router(auth_router, tags=["auth"])
    app.include_router(invoices_router, prefix="/api/v1", tags=["invoices"])
    app.include_router(dashboard_router, prefix="/api/v1", tags=["dashboard"])
    app.include_router(gstin_router, prefix="/api/v1", tags=["gstin"])
    app.include_router(admin_router, prefix="/api/v1", tags=["admin"])

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        from app.db.seed import seed_users
        seed_users()

    return app


app = create_app()
