"""Local development: SQLite unless DATABASE_URL is set."""

import os

import dj_database_url

from .base import *  # noqa: F401,F403
from .base import BASE_DIR, cors_origins_from_env

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-not-for-production")
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]"]

database_url = os.environ.get("DATABASE_URL")
if database_url:
    DATABASES = {"default": dj_database_url.parse(database_url)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

CORS_ALLOWED_ORIGINS = cors_origins_from_env()
CORS_ALLOW_CREDENTIALS = False
