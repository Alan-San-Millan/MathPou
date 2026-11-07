"""Create (or refresh) the thesis advisor's account from env vars on each deploy."""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Crea o actualiza la cuenta del asesor con ADVISOR_USERNAME / ADVISOR_EMAIL / ADVISOR_PASSWORD."

    def handle(self, *args, **options):
        username = os.environ.get("ADVISOR_USERNAME", "").strip()
        password = os.environ.get("ADVISOR_PASSWORD", "")
        email = os.environ.get("ADVISOR_EMAIL", "").strip()

        if not username or not password:
            self.stdout.write("ensure_advisor: ADVISOR_USERNAME/ADVISOR_PASSWORD vacíos, nada que hacer.")
            return

        user, created = get_user_model().objects.get_or_create(username=username)
        if email:
            user.email = email
        user.is_active = True
        user.set_password(password)
        user.save()

        self.stdout.write(f"ensure_advisor: cuenta '{username}' {'creada' if created else 'actualizada'}.")
