from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    app_name: str = "Public Sector Admin Super App"
    app_version: str = "0.1.0"
    backend_root: Path = Path(__file__).resolve().parents[2]
    db_path: Path = Path(__file__).resolve().parents[2] / "data" / "app.db"


settings = Settings()
