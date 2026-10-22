import io
import datetime
from typing import Dict, Any
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.account import Account
from app.services.risk_scoring import RiskScoringService
from app.services.transaction_analysis import TransactionAnalysisService
from app.services.money_trail import MoneyTrailService
from app.services.complaint_correlation import ComplaintCorrelationService

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportGenerationService:
    def __init__(self, db: Session):
        self.db = db
        self.risk_service = RiskScoringService(db)
        self.flow_service = TransactionAnalysisService(db)
        self.trail_service = MoneyTrailService(db)
        self.complaint_service = ComplaintCorrelationService(db)

    def generate_dossier_json(self, account_id: str, case_id: str = "CASE-2026-0042") -> Dict[str, Any]:
        """Generates comprehensive structured JSON evidence dossier.
        Returns 404 error if account does not exist without fabricating evidence.
        """
        account = self.db.query(Account).filter(Account.account_id == account_id).first()
        if not account:
            raise HTTPException(
                status_code=404,
                detail=f"Account '{account_id}' not found. Cannot generate investigation dossier for nonexistent account."
            )

        risk_data = self.risk_service.calculate_explainable_risk(account_id)
        flow_data = self.flow_service.get_flow_analysis(account_id)
        trail_data = self.trail_service.trace_money_trail(account_id)
        complaint_data = self.complaint_service.get_complaints_for_account(account_id)
        entities = self.complaint_service.get_associated_entities(account_id)

        # Dynamically formulate investigative conclusions strictly based on evaluated evidence
        score = risk_data.get("risk_score", 0)
        complaints_count = len(complaint_data)
        incoming_total = flow_data.get("incoming_total", 0.0)
        layering_total = flow_data.get("layering_total", 0.0)
        pass_through_pct = (layering_total / incoming_total * 100.0) if incoming_total > 0 else 0.0

        if score >= 80:
            recommended_action = "PRIORITISE FOR INVESTIGATOR REVIEW"
            rationale = (
                f"High-priority suspicion: Evaluated risk score {score}/100 with {complaints_count} correlated "
                f"complaint(s) and {pass_through_pct:.1f}% pass-through layering velocity. Prioritise for investigator review; "
                f"verify supporting evidence before considering further action."
            )
        elif score >= 60:
            recommended_action = "EXPEDITE INVESTIGATIVE VERIFICATION"
            rationale = (
                f"Elevated mule suspicion: Evaluated risk score {score}/100 with {complaints_count} correlated "
                f"complaint(s). Prioritise for analyst audit; verify source of funds and beneficial ownership before considering action."
            )
        elif score >= 35:
            recommended_action = "STANDARD INVESTIGATIVE REVIEW"
            rationale = (
                f"Moderate transactional deviation: Evaluated risk score {score}/100. "
                f"Routine compliance verification and KYC re-validation advised."
            )
        else:
            recommended_action = "NO ACTION REQUIRED // BENIGN BEHAVIOUR"
            rationale = (
                f"Low evaluated risk profile: Score {score}/100. "
                f"Transactional patterns consistent with normal activity; no indicators of illicit fund dispersal."
            )

        now_utc = datetime.datetime.now(datetime.timezone.utc)

        return {
            "dossier_metadata": {
                "report_id": f"REP-{now_utc.strftime('%Y%m%d%H%M%S')}",
                "case_reference": case_id,
                "generation_timestamp": now_utc.isoformat(),
                "generating_agency": "Cyber Crime Unit / Financial Intelligence Platform",
                "classification": "CONFIDENTIAL // LAW ENFORCEMENT INVESTIGATION ONLY",
                "synthetic_notice": "STATUTORY NOTICE: Generated synthetically for Cyber Hackathon 2026 PS-01 evaluation. Does not represent actual criminal records."
            },
            "target_account": {
                "account_id": account.account_id,
                "account_number_masked": account.account_number_masked,
                "bank_name": account.bank_name,
                "account_holder_name": account.account_holder_name,
                "registered_mobile": account.registered_mobile_masked or "NOT_RECORDED",
                "status": account.status
            },
            "risk_assessment": risk_data,
            "transaction_flow_analysis": flow_data,
            "money_trail_sequence": self.trail_service.get_money_trail_sequence(account_id),
            "linked_cybercrime_complaints": complaint_data,
            "associated_entities": entities,
            "investigative_conclusions": {
                "recommended_action": recommended_action,
                "rationale": rationale
            }
        }

    def generate_dossier_pdf(self, account_id: str, case_id: str = "CASE-2026-0042") -> bytes:
        """Generates printable PDF Evidence Dossier."""
        data = self.generate_dossier_json(account_id, case_id)
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        section_style = ParagraphStyle(
            'SectionStyle',
            parent=styles['Heading2'],
            fontSize=13,
            textColor=colors.HexColor('#1E3A8A'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#1E293B'),
            spaceAfter=4
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#DC2626'),
            spaceBefore=14
        )

        now_utc = datetime.datetime.now(datetime.timezone.utc)
        elements = []
        elements.append(Paragraph("FRAUDTRACE AI — FINANCIAL CRIME INVESTIGATION DOSSIER", title_style))
        elements.append(Paragraph(f"Case Ref: {case_id} | Target Account: {data['target_account']['account_number_masked']} | Generated: {now_utc.strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
        elements.append(Spacer(1, 8))

        # Risk Score Banner Table
        score_val = str(data['risk_assessment']['risk_score'])
        tier_val = str(data['risk_assessment'].get('risk_tier', 'LOW')).upper()
        confidence_val = f"{int(data['risk_assessment'].get('confidence', 0.9) * 100)}%"
        action_val = data['investigative_conclusions']['recommended_action'].split('/')[0].strip()

        score_table_data = [
            ["EVALUATED RISK SCORE", "RISK PRIORITY TIER", "CONFIDENCE LEVEL", "ACTION STATUS"],
            [f"{score_val} / 100", tier_val, confidence_val, action_val]
        ]
        t = Table(score_table_data, colWidths=[130, 130, 130, 130])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F1F5F9')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))

        # Contributing Risk Indicators
        elements.append(Paragraph("1. Top Contributing Risk Factors (Explainable Breakdown)", section_style))
        factor_rows = [["Indicator", "Points", "Impact %", "Evidence Summary"]]
        for f in data['risk_assessment']['top_contributing_factors']:
            factor_rows.append([
                Paragraph(f['name'], body_style),
                f"{f['points_awarded']}/{f['max_points']}",
                f"{f['percentage_impact']}%",
                Paragraph(f['summary'], body_style)
            ])
        ft = Table(factor_rows, colWidths=[150, 50, 60, 260])
        ft.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(ft)
        elements.append(Spacer(1, 12))

        # Flow Analysis
        elements.append(Paragraph("2. Fund Flow & Layering Summary", section_style))
        flow = data['transaction_flow_analysis']
        flow_rows = [
            ["Incoming Credits", "Layering / Transfers", "Dispersal to Sinks", "Retained Balance"],
            [flow['incoming_total_formatted'], flow['layering_total_formatted'], flow['outflow_total_formatted'], f"₹{flow['retained_balance']:,.0f} ({flow['retained_percentage']}%)"]
        ]
        flt = Table(flow_rows, colWidths=[130, 130, 130, 130])
        flt.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F8FAFC')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ]))
        elements.append(flt)
        elements.append(Spacer(1, 12))

        # Linked Complaints
        elements.append(Paragraph("3. Correlated Cybercrime Complaints (NCRP / Incident Reports)", section_style))
        complaint_rows = [["Complaint Ref", "Incident Date", "Fraud Category", "Reported Loss", "Status"]]
        for c in data['linked_cybercrime_complaints']:
            complaint_rows.append([
                c['complaint_id'],
                str(c['incident_date'])[:10],
                c['complaint_type'],
                c['reported_loss_formatted'],
                c['status']
            ])
        ct = Table(complaint_rows, colWidths=[100, 80, 140, 100, 100])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        elements.append(ct)
        elements.append(Spacer(1, 16))

        # Mandatory Statutory Disclaimer
        elements.append(Paragraph(data['dossier_metadata']['synthetic_notice'], disclaimer_style))
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
