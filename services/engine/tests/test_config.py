import pytest

from app.config import EngineSettings


def test_fake_llm_provider_does_not_require_api_key():
    settings = EngineSettings(
        DATABASE_URL="postgresql://test:test@localhost:5432/sentinel",
        INTERNAL_SERVICE_TOKEN="test_secret_token_at_least_16_chars",
        ENCRYPTION_KEY="test_encryption_key_at_least_16_chars",
        LLM_PROVIDER="fake",
    )
    assert settings.llm_provider == "fake"
    assert not settings.gemini_api_key


def test_gemini_provider_requires_gemini_api_key():
    with pytest.raises(ValueError, match="GEMINI_API_KEY is required"):
        EngineSettings(
            DATABASE_URL="postgresql://test:test@localhost:5432/sentinel",
            INTERNAL_SERVICE_TOKEN="test_secret_token_at_least_16_chars",
            ENCRYPTION_KEY="test_encryption_key_at_least_16_chars",
            LLM_PROVIDER="gemini",
            GEMINI_API_KEY=None,
        )


def test_gemini_provider_succeeds_with_api_key():
    settings = EngineSettings(
        DATABASE_URL="postgresql://test:test@localhost:5432/sentinel",
        INTERNAL_SERVICE_TOKEN="test_secret_token_at_least_16_chars",
        ENCRYPTION_KEY="test_encryption_key_at_least_16_chars",
        LLM_PROVIDER="gemini",
        GEMINI_API_KEY="test_gemini_key",
    )
    assert settings.llm_provider == "gemini"
    assert settings.gemini_api_key == "test_gemini_key"
