"""
SentinelAI Engine FastAPI Service.
Main entrypoint providing health probes, ingest, internal orchestration API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SentinelAI Engine",
    description=(
        "Internal autonomous reliability engine for ingestion, analysis, and sandbox verification"
    ),
    version="0.1.0",
)

# Engine binds to 127.0.0.1; restrict CORS to localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://127.0.0.1:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check():
    """Liveness probe: verifies engine process is responsive."""
    return {
        "status": "ok",
        "service": "sentinel-engine",
        "version": "0.1.0",
    }


@app.get("/ready", tags=["System"])
async def readiness_check():
    """Readiness probe: verifies engine is ready to accept events and jobs."""
    return {
        "status": "ready",
        "service": "sentinel-engine",
        "ready": True,
    }
