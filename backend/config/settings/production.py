"""Production settings. Secrets come from the environment; nothing is guessed."""

import os

import dj_database_url

from .base import *  # noqa: F401,F403
from .base import cors_origins_from_env

SECRET_KEY = os.environ["SECRET_KEY"]
DEBUG = False

allowed = os.environ.get("ALLOWED_HOSTS", "")
ALLOWED_HOSTS = [host.strip() for host in allowed.split(",") if host.strip()]
render_hostname = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if render_hostname:
    ALLOWED_HOSTS.append(render_hostname)
if not ALLOWED_HOSTS:
    raise RuntimeError("ALLOWED_HOSTS (or RENDER_EXTERNAL_HOSTNAME) must be set in production.")

DATABASES = {
    "default": dj_database_url.parse(os.environ["DATABASE_URL"]),
}

CORS_ALLOWED_ORIGINS = cors_origins_from_env()
CORS_ALLOW_CREDENTIALS = False

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
