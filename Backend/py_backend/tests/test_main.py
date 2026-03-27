import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_db():
    init_db()
    yield


def test_login():
    """Test JWT token generation"""
    response = client.post("/auth/token", json={"user_id": "test_user"})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_create_organization_unauthorized():
    """Test that POST /organizations requires authentication"""
    response = client.post("/organizations", json={"name": "Test Org"})
    assert response.status_code == 403


def test_create_organization_authorized():
    """Test organization creation with valid token"""
    # Get token
    token_response = client.post("/auth/token", json={"user_id": "test_user"})
    token = token_response.json()["access_token"]
    
    # Create organization
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/organizations", json={"name": "Test Organization"}, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Organization"


def test_create_evaluation_authorized():
    """Test evaluation creation with valid token"""
    # Get token
    token_response = client.post("/auth/token", json={"user_id": "test_user"})
    token = token_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create evaluation
    response = client.post(
        "/evaluations",
        json={"organization_id": 1, "answers": {"q1": "answer1"}},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["organization_id"] == 1


def test_list_organizations():
    """Test GET /organizations"""
    token_response = client.post("/auth/token", json={"user_id": "test_user"})
    token = token_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/organizations", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_list_evaluations():
    """Test GET /evaluations"""
    token_response = client.post("/auth/token", json={"user_id": "test_user"})
    token = token_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/evaluations", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)
