"""
SentinelAI Engine Environment Configuration & Validation.
Loads from root .env and validates required variables with Pydantic.
"""

from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Path to root .env file
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = ROOT_DIR / ".env"


class EngineSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Core environment
    node_env: str = Field(default="development", alias="NODE_ENV")
    database_url: str = Field(..., alias="DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    internal_service_token: str = Field(..., min_length=16, alias="INTERNAL_SERVICE_TOKEN")
    encryption_key: str = Field(..., min_length=16, alias="ENCRYPTION_KEY")

    # Engine host binding
    engine_port: int = Field(default=8000, alias="ENGINE_PORT")
    engine_bind: str = Field(default="127.0.0.1", alias="ENGINE_BIND")
    engine_data_dir: Path = Field(default=Path("./engine_data"), alias="ENGINE_DATA_DIR")
    demo_repo_path: Path = Field(default=Path("./demo/checkout-service"), alias="DEMO_REPO_PATH")
    allowed_local_repo_base: Path = Field(default=Path("./demo"), alias="ALLOWED_LOCAL_REPO_BASE")

    # LLM settings
    llm_provider: Literal["gemini", "anthropic", "openai", "ollama", "fake"] = Field(
        default="gemini", alias="LLM_PROVIDER"
    )
    llm_model: str = Field(default="gemini-2.5-flash", alias="LLM_MODEL")
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    ollama_base_url: str = Field(default="http://localhost:11434", alias="OLLAMA_BASE_URL")

    # Budgets and limits
    budget_max_tokens_per_incident: int = Field(
        default=500000, alias="BUDGET_MAX_TOKENS_PER_INCIDENT"
    )
    budget_max_tool_calls_per_agent_run: int = Field(
        default=40, alias="BUDGET_MAX_TOOL_CALLS_PER_AGENT_RUN"
    )
    budget_max_wall_minutes: int = Field(default=15, alias="BUDGET_MAX_WALL_MINUTES")
    fix_max_attempts: int = Field(default=4, alias="FIX_MAX_ATTEMPTS")
    critic_max_rounds: int = Field(default=3, alias="CRITIC_MAX_ROUNDS")
    patch_max_files: int = Field(default=5, alias="PATCH_MAX_FILES")
    patch_max_changed_lines: int = Field(default=150, alias="PATCH_MAX_CHANGED_LINES")
    default_daily_investigations: int = Field(default=5, alias="DEFAULT_DAILY_INVESTIGATIONS")

    # Sandbox limits
    sandbox_memory_mb: int = Field(default=512, alias="SANDBOX_MEMORY_MB")
    sandbox_cpus: int = Field(default=1, alias="SANDBOX_CPUS")
    sandbox_pids: int = Field(default=256, alias="SANDBOX_PIDS")
    sandbox_timeout_s: int = Field(default=120, alias="SANDBOX_TIMEOUT_S")
    sandbox_tmpfs_mb: int = Field(default=256, alias="SANDBOX_TMPFS_MB")
    runner_image: str = Field(default="sentinel-runner:py312", alias="RUNNER_IMAGE")

    # Optional GitHub token
    github_token: str | None = Field(default=None, alias="GITHUB_TOKEN")

    @model_validator(mode="after")
    def validate_llm_api_key(self) -> "EngineSettings":
        if self.llm_provider not in ("fake", "ollama"):
            has_gemini = bool(self.gemini_api_key and self.gemini_api_key.strip())
            has_anthropic = bool(self.anthropic_api_key and self.anthropic_api_key.strip())
            has_openai = bool(self.openai_api_key and self.openai_api_key.strip())

            if self.llm_provider == "gemini" and not has_gemini:
                raise ValueError("GEMINI_API_KEY is required when LLM_PROVIDER is 'gemini'")
            if self.llm_provider == "anthropic" and not has_anthropic:
                raise ValueError("ANTHROPIC_API_KEY is required when LLM_PROVIDER is 'anthropic'")
            if self.llm_provider == "openai" and not has_openai:
                raise ValueError("OPENAI_API_KEY is required when LLM_PROVIDER is 'openai'")
        return self


def get_settings() -> EngineSettings:
    """Validate and return engine settings, failing fast with descriptive errors."""
    try:
        return EngineSettings()
    except Exception as exc:
        print(f"\n❌ [ENGINE STARTUP ERROR] Environment configuration invalid:\n{exc}\n")
        raise
