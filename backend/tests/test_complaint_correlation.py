import pytest
from app.core.database import SessionLocal
from app.services.complaint_correlation import ComplaintCorrelationService

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_complaint_links_backed_by_stored_records(db_session):
    service = ComplaintCorrelationService(db_session)
    complaints = service.get_complaints_for_account("ACC-4321")

    # Target mule account ACC-4321 is linked to 3 complaints in database fixtures
    assert len(complaints) == 3
    complaint_ids = {c["complaint_id"] for c in complaints}
    assert "C2026-0158" in complaint_ids
    assert "C2026-0210" in complaint_ids
    assert "C2026-0305" in complaint_ids

    # Verify link reasons and supporting evidence record IDs are present
    for c in complaints:
        assert c["link_reason"] is not None
        assert len(c["link_reason"]) > 5
        assert isinstance(c["supporting_evidence"], list)
        assert len(c["supporting_evidence"]) >= 1
        assert any(c["complaint_id"] in ev for ev in c["supporting_evidence"])

def test_accounts_with_no_linked_complaints(db_session):
    service = ComplaintCorrelationService(db_session)
    # ACC-7810 has no complaints linked to it
    complaints = service.get_complaints_for_account("ACC-7810")
    assert complaints == []

def test_missing_account_handling(db_session):
    service = ComplaintCorrelationService(db_session)
    # Nonexistent accounts safely return empty list without fabricating records
    complaints = service.get_complaints_for_account("ACC-NONEXISTENT-9999")
    assert complaints == []

    entities = service.get_associated_entities("ACC-NONEXISTENT-9999")
    assert entities == []

def test_dynamic_associated_entities_from_transactions(db_session):
    service = ComplaintCorrelationService(db_session)
    # For ACC-4321, counterparties are dynamically aggregated from transaction records
    entities_4321 = service.get_associated_entities("ACC-4321")
    assert len(entities_4321) >= 4

    # Verify merchant entity is dynamically identified
    merchant_ent = next((e for e in entities_4321 if e["entity_type"] == "Merchant"), None)
    assert merchant_ent is not None
    assert "TechKart" in merchant_ent["name_or_id"]

    # Verify account and mobile entities
    mobile_ent = next((e for e in entities_4321 if e["entity_type"] == "Mobile"), None)
    assert mobile_ent is not None
    assert "+91 98765 43210" in mobile_ent["name_or_id"]

    # For ACC-8765, entities must be distinct from ACC-4321
    entities_8765 = service.get_associated_entities("ACC-8765")
    names_4321 = {e["name_or_id"] for e in entities_4321}
    names_8765 = {e["name_or_id"] for e in entities_8765}
    assert names_4321 != names_8765

def test_list_all_complaints_endpoint(db_session):
    service = ComplaintCorrelationService(db_session)
    all_complaints = service.list_all_complaints(limit=10)

    # Returns all registered complaints in the database
    assert len(all_complaints) >= 3
    for c in all_complaints:
        assert "complaint_id" in c
        assert "reported_loss_amount" in c
        assert "status" in c
        assert c["linked_accounts_count"] >= 1
