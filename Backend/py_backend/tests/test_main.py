import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db

client = TestClient(app)

ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Admin2026!Secure*"


@pytest.fixture(scope="module")
def setup_db():
    init_db()
    yield


def _admin_headers():
    token_response = client.post(
        "/auth/token",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert token_response.status_code == 200, token_response.text
    token = token_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_login(setup_db):
    response = client.post(
        "/auth/token",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body.get("role") == "admin"


def test_create_organization_unauthorized(setup_db):
    response = client.post("/organizations", json={"name": "Test Org", "sector": "x", "size": "S"})
    assert response.status_code == 403


def test_create_organization_authorized(setup_db):
    headers = _admin_headers()
    response = client.post(
        "/organizations",
        json={"name": "Test Organization", "sector": "Tech", "size": "Pequeña"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("nombre") == "Test Organization"


def test_create_evaluation_authorized(setup_db):
    headers = _admin_headers()
    response = client.post(
        "/evaluations",
        json={"organization_id": 1, "answers": {"q1": "answer1"}},
        headers=headers,
    )
    assert response.status_code in (200, 409), response.text


def test_list_organizations(setup_db):
    headers = _admin_headers()
    response = client.get("/organizations", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_evaluations(setup_db):
    headers = _admin_headers()
    response = client.get("/evaluations", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
