import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_solved_cases():
    response = client.get("/api/v1/cases/solved-cases")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    first_case = data[0]
    assert "fir_number" in first_case
    assert "accused_name" in first_case
    assert "account_number" in first_case
    assert "mobile_number" in first_case
    assert "bank_registered_mobile" in first_case
    assert "layering_route" in first_case

def test_create_and_get_solved_case():
    new_case_payload = {
        "fir_number": "FIR No. 204/2026 u/s 420/120B IPC",
        "police_station": "Cyber Crime Police Station, Bhagalpur",
        "district": "Bhagalpur",
        "state": "Bihar",
        "investigating_officer": "Inspector S. K. Jha",
        "crime_category": "Fake Job Part-Time Task Scam",
        "total_fraud_amount": 1800000.0,
        "recovered_amount": 1500000.0,
        "date_solved": "2026-10-20",
        "case_status": "Charge-sheeted",
        "accused_name": "Deepak Kumar Yadav",
        "father_name": "Shri Ramakant Yadav",
        "age": 27,
        "address": "Vill. Sabour, PS Sabour, Dist. Bhagalpur, Bihar",
        "mobile_number": "+91-94312-99887",
        "alternate_mobile": "+91-87890-11223",
        "id_proof": "Aadhaar: XXXX-XXXX-5561",
        "bank_name": "Punjab National Bank",
        "account_number": "ACC-3333",
        "ifsc_code": "PUNB0021300",
        "branch_name": "Bhagalpur Main",
        "bank_registered_mobile": "+91-94312-99887",
        "upi_id": "deepak3333@okpnb",
        "layering_speed_minutes": 4,
        "layering_route": "Layer 1: Telegram deposits -> Layer 2: Fast-split across 4 mule accounts -> Layer 3: P2P crypto exchange off-ramp",
        "modus_operandi": "Victims trapped through WhatsApp work-from-home invitations.",
        "breakthrough_trail": "1930 alert triggered fast debit freeze via Bank Nodal Officer.",
        "seized_items": "5 Smart phones, 11 SIM cards, 4 Passbooks.",
        "national_portal_ref": "NCRP-ACK-2026-BIH-BHAG-0204"
    }

    create_res = client.post("/api/v1/cases/solved-cases", json=new_case_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["fir_number"] == new_case_payload["fir_number"]
    assert created_data["accused_name"] == "Deepak Kumar Yadav"
    case_id = created_data["case_id"]

    get_res = client.get(f"/api/v1/cases/solved-cases/{case_id}")
    assert get_res.status_code == 200
    assert get_res.json()["case_id"] == case_id
