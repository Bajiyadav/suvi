import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import (
    get_current_investigator,
    mask_account_number,
    mask_mobile_number,
    InvestigatorRole,
    INVESTIGATOR_PROFILES
)
from app.core.database import SessionLocal
from app.models.audit import AuditLog

client = TestClient(app)

def test_authentication_valid_api_key_header():
    """Verifies that providing a valid X-API-Key header authenticates the investigator."""
    headers = {"X-API-Key": "ft-investigator-secret-key-2026"}
    response = client.post(
        "/api/v1/cases/action-request",
        json={"account_id": "ACC-4321", "action_type": "SCHEDULE_INTERVIEW", "justification": "Summon account holder"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "recorded"
    assert data["investigator"] == "Inspector Sharma"


def test_authentication_valid_bearer_token():
    """Verifies that providing a valid Bearer Token authenticates the lead analyst."""
    headers = {"Authorization": "Bearer ft-lead-analyst-key-2026"}
    response = client.post(
        "/api/v1/cases/action-request",
        json={"account_id": "ACC-4321", "action_type": "COMPLIANCE_AUDIT", "justification": "FIU Escalation"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["investigator"] == "Dr. V. Rao"


def test_authentication_invalid_api_key_returns_401():
    """Verifies that an invalid API key is immediately rejected with 401 Unauthorized."""
    headers = {"X-API-Key": "malicious-or-wrong-key-1234"}
    response = client.post(
        "/api/v1/cases/action-request",
        json={"account_id": "ACC-4321", "action_type": "SCHEDULE_INTERVIEW"},
        headers=headers
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_auth_enabled_mode_enforcement():
    """Verifies that when AUTH_ENABLED=True, requests without credentials are rejected with 401."""
    original_auth_setting = settings.AUTH_ENABLED
    try:
        settings.AUTH_ENABLED = True
        # Call without headers
        response = client.post(
            "/api/v1/cases/action-request",
            json={"account_id": "ACC-4321", "action_type": "SCHEDULE_INTERVIEW"}
        )
        assert response.status_code == 401
        assert "authentication required" in response.json()["detail"].lower()

        # Call with valid headers should succeed even when AUTH_ENABLED=True
        headers = {"X-API-Key": "ft-investigator-secret-key-2026"}
        auth_response = client.post(
            "/api/v1/cases/action-request",
            json={"account_id": "ACC-4321", "action_type": "SCHEDULE_INTERVIEW"},
            headers=headers
        )
        assert auth_response.status_code == 200
    finally:
        settings.AUTH_ENABLED = original_auth_setting


def test_statutory_prohibition_against_automated_freeze():
    """CRITICAL RULE: AI risk scores must never trigger automated liens or freezes.
    Verifies that adverse financial action requests return HTTP 400 with a statutory violation notice.
    """
    # 1. Attempt automated freeze
    res_freeze = client.post(
        "/api/v1/cases/action-request",
        json={"account_id": "ACC-4321", "action_type": "FREEZE_ACCOUNT", "justification": "Risk score is 96"}
    )
    assert res_freeze.status_code == 400
    assert "statutory violation" in res_freeze.json()["detail"].lower()
    assert "automated account freezing" in res_freeze.json()["detail"].lower()

    # 2. Attempt automated lien
    res_lien = client.post(
        "/api/v1/cases/action-request",
        json={"account_id": "ACC-4321", "action_type": "INITIATE_LIEN", "justification": "Mule suspect"}
    )
    assert res_lien.status_code == 400
    assert "statutory violation" in res_lien.json()["detail"].lower()


def test_sensitive_data_masking_utilities():
    """Verifies that PII and sensitive banking credentials are masked according to privacy guidelines."""
    # Account masking
    assert mask_account_number("987654321012") == "XXXX 1012"
    assert mask_account_number("4321") == "XXXX 4321"
    assert mask_account_number(None) == "XXXX 0000"

    # Mobile masking
    masked_phone = mask_mobile_number("+919876543210")
    assert "XXXXX" in masked_phone
    assert masked_phone.startswith("+91")
    assert mask_mobile_number(None) == "NOT_RECORDED"


def test_input_validation_and_injection_resilience():
    """Verifies parameterized query resilience against SQL injection payloads and input sanitization."""
    # 1. SQL injection attempt in URL path
    sql_injection_payload = "ACC-4321' OR '1'='1"
    response = client.get(f"/api/v1/accounts/{sql_injection_payload}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Account not found"

    # 2. SQL injection in money trail path
    res_trail = client.get(f"/api/v1/money-trail/{sql_injection_payload}")
    assert res_trail.status_code == 404

    # 3. Empty note submission
    res_empty_note = client.post(
        "/api/v1/cases/notes",
        json={"account_id": "ACC-4321", "note_text": "   "}
    )
    assert res_empty_note.status_code == 422


def test_audit_log_captures_authenticated_investigator():
    """Verifies that authenticated actions persist the real investigator identity in the audit trail."""
    db = SessionLocal()
    headers = {"X-API-Key": "ft-investigator-secret-key-2026"}
    try:
        res = client.post(
            "/api/v1/cases/action-request",
            json={"account_id": "ACC-4321", "action_type": "SUBPOENA_RECORDS", "justification": "Court order issued"},
            headers=headers
        )
        assert res.status_code == 200

        # Check audit log in DB
        last_log = db.query(AuditLog).filter(
            AuditLog.target_entity == "ACC-4321",
            AuditLog.action == "REQUEST_SUBPOENA_RECORDS"
        ).order_by(AuditLog.timestamp.desc()).first()

        assert last_log is not None
        assert last_log.actor == "Inspector Sharma"
        assert "Court order issued" in last_log.details
    finally:
        db.close()
