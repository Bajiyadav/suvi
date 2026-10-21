from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.core.database import get_db
from app.models.audit import AuditLog
from app.services.report_generation import ReportGenerationService
import datetime

router = APIRouter()

@router.get("/dossier-json/{account_id}")
def export_dossier_json(
    account_id: str,
    case_id: str = Query("CASE-2026-0042"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Generates structured JSON evidence dossier with audit logging."""
    service = ReportGenerationService(db)
    dossier = service.generate_dossier_json(account_id, case_id)

    # Log audit event
    audit = AuditLog(
        log_id=f"AUD-{datetime.datetime.utcnow().timestamp()}",
        action="EXPORT_DOSSIER_JSON",
        target_entity=account_id,
        details=f"Exported JSON dossier for case {case_id}"
    )
    db.add(audit)
    db.commit()

    return dossier

@router.get("/download-pdf/{account_id}")
def download_dossier_pdf(
    account_id: str,
    case_id: str = Query("CASE-2026-0042"),
    db: Session = Depends(get_db)
):
    """Generates downloadable PDF Evidence Report."""
    service = ReportGenerationService(db)
    pdf_bytes = service.generate_dossier_pdf(account_id, case_id)

    # Log audit event
    audit = AuditLog(
        log_id=f"AUD-{datetime.datetime.utcnow().timestamp()}",
        action="EXPORT_DOSSIER_PDF",
        target_entity=account_id,
        details=f"Downloaded PDF dossier for case {case_id}"
    )
    db.add(audit)
    db.commit()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=FraudTrace_Evidence_{account_id}_{case_id}.pdf"
        }
    )
