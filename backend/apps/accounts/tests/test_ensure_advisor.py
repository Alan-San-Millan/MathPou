from django.contrib.auth.models import User
from django.core.management import call_command


def test_creates_advisor_from_env(db, monkeypatch):
    monkeypatch.setenv("ADVISOR_USERNAME", "asesor")
    monkeypatch.setenv("ADVISOR_EMAIL", "asesor@test.com")
    monkeypatch.setenv("ADVISOR_PASSWORD", "secreto12")

    call_command("ensure_advisor")

    user = User.objects.get(username="asesor")
    assert user.email == "asesor@test.com"
    assert user.check_password("secreto12")
    assert not user.is_staff


def test_rerun_updates_password(db, monkeypatch):
    User.objects.create_user(username="asesor", password="viejo1234")
    monkeypatch.setenv("ADVISOR_USERNAME", "asesor")
    monkeypatch.setenv("ADVISOR_PASSWORD", "nuevo1234")

    call_command("ensure_advisor")

    assert User.objects.count() == 1
    assert User.objects.get(username="asesor").check_password("nuevo1234")


def test_noop_without_env(db, monkeypatch):
    monkeypatch.delenv("ADVISOR_USERNAME", raising=False)
    monkeypatch.delenv("ADVISOR_PASSWORD", raising=False)

    call_command("ensure_advisor")

    assert User.objects.count() == 0
