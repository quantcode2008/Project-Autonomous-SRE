"""
SentinelAI Celery Worker Entrypoint.
Handles asynchronous background tasks for analysis, sandbox execution, and sweeper.
"""

import os

from celery import Celery

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "sentinel_worker",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="ping")
def ping():
    return "pong"
