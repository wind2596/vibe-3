import os
from dataclasses import dataclass, field
from pathlib import Path


def _parse_csv_env(name: str, default: tuple[str, ...]) -> list[str]:
    raw_value = os.getenv(name)
    if not raw_value:
        return list(default)
    return [item.strip() for item in raw_value.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_name: str = "Public Sector Admin Super App"
    app_version: str = "0.1.0"
    backend_root: Path = Path(__file__).resolve().parents[2]
    db_path: Path = Path(__file__).resolve().parents[2] / "data" / "app.db"
    cors_origins: list[str] = field(
        default_factory=lambda: _parse_csv_env(
            "APP_CORS_ORIGINS",
            (
                "http://127.0.0.1:5173",
                "http://localhost:5173",
                "https://wind2596.github.io",
            ),
        )
    )


settings = Settings()
