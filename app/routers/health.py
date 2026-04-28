from fastapi import APIRouter, Depends
import redis
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.redis import get_redis_client
from app.db.deps import get_db


router = APIRouter()


@router.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict:
    db.execute(text("SELECT 1"))
    try:
        redis_client = get_redis_client()
        redis_client.ping()
        redis_status = "ok"
    except redis.RedisError:
        redis_status = "unavailable"
    return {"status": "ok", "redis": redis_status}
