import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="ana", email="ana@test.com", password="secreto12")


def test_health_is_public(api):
    response = api.get("/api/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_and_me(api, db):
    created = api.post(
        "/api/auth/register/",
        {"username": "luis", "email": "luis@test.com", "password": "secreto12"},
        format="json",
    )
    assert created.status_code == 201
    token = created.json()["access"]
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    me = api.get("/api/auth/me/")
    assert me.status_code == 200
    assert me.json()["username"] == "luis"


def test_pulse_requires_auth(api, db):
    response = api.post("/api/signals/pulse/", {"datos": [[0, 0], [1, 1]]}, format="json")
    assert response.status_code == 401


def test_pulse_returns_waveform(api, user):
    token = api.post(
        "/api/auth/token/",
        {"username": "ana", "password": "secreto12"},
        format="json",
    ).json()["access"]
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    response = api.post(
        "/api/signals/pulse/",
        {"datos": [[0, 0], [1, 1], [-2, 3]]},
        format="json",
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"time", "signal", "T", "w0"}
    assert body["T"] == 3


def test_pulse_with_harmonics_returns_reconstruction(api, user):
    token = api.post(
        "/api/auth/token/",
        {"username": "ana", "password": "secreto12"},
        format="json",
    ).json()["access"]
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    response = api.post(
        "/api/signals/pulse/",
        {"datos": [[0, 0], [1, 1], [-2, 3]], "armonicos": 20},
        format="json",
    )
    assert response.status_code == 200
    reconstruction = response.json()["reconstruction"]
    assert len(reconstruction["time"]) == len(reconstruction["signal"])

    invalid = api.post(
        "/api/signals/pulse/",
        {"datos": [[0, 0], [1, 1]], "armonicos": 0},
        format="json",
    )
    assert invalid.status_code == 400

    too_many = api.post(
        "/api/signals/pulse/",
        {"datos": [[0, 0], [1, 1]], "armonicos": 3001},
        format="json",
    )
    assert too_many.status_code == 400


def test_login_with_email(api, user):
    response = api.post(
        "/api/auth/token/",
        {"username": "ana@test.com", "password": "secreto12"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.json()


def test_login_with_username_still_works(api, user):
    response = api.post(
        "/api/auth/token/",
        {"username": "ana", "password": "secreto12"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.json()


def test_example_includes_signal(api, user):
    token = api.post(
        "/api/auth/token/",
        {"username": "ana", "password": "secreto12"},
        format="json",
    ).json()["access"]
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    response = api.get("/api/signals/examples/1/")
    assert response.status_code == 200
    body = response.json()
    assert "signal" in body
    assert len(body["signal"]) == len(body["time"])
