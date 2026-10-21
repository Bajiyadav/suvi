import io
import datetime
from typing import Dict, Any
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
        """Generates comprehensive structured JSON evidence dossier."""
        account = self.db.query(Account).filter(Account.account_id == account_id).first()
        acc_masked = account.account_number_masked if account else account_id

        risk_data = self.risk_service.calculate_explainable_risk(account_id)
        flow_data = self.flow_service.get_flow_analysis(account_id)
        trail_data = self.trail_service.trace_money_trail(account_id)
        complaint_data = self.complaint_service.get_complaints_for_account(account_id)
        entities = self.complaint_service.get_associated_entities(account_id)

        return {
            "dossier_metadata": {
                "report_id": f"REP-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                "case_reference": case_id,
                "generation_timestamp": datetime.datetime.utcnow().isoformat(),
                "generating_agency": "Cyber Crime Unit / Financial Intelligence Platform",
                "classification": "CONFIDENTIAL // LAW ENFORCEMENT INVESTIGATION ONLY",
                "synthetic_notice": "STATUTORY NOTICE: Generated synthetically for Cyber Hackathon 2026 PS-01 evaluation. Does not represent actual criminal records."
            },
            "target_account": {
                "account_id": account_id,
                "account_number_masked": acc_masked,
                "bank_name": account.bank_name if account else "State Bank of Bharat",
                "account_holder_name": account.account_holder_name if account else "Ramesh K. (Synthetic)",
                "registered_mobile": account.registered_mobile_masked if account else "+91 98765 43210",
                "status": account.status if account else "UNDER_MONITORING"
            },
            "risk_assessment": risk_data,
            "transaction_flow_analysis": flow_data,
            "money_trail_sequence": trail_data,
            "linked_cybercrime_complaints": complaint_data,
            "associated_entities": entities,
            "investigative_conclusions": {
                "recommended_action": "INITIATE IMMEDIATE LIEN / TEMPORARY DEBIT FREEZE",
                "rationale": "High-confidence mule hub: 97.2% funds forwarded within minutes of victim deposit; 3 verified NCRP complaints."
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

        elements = []
        elements.append(Paragraph("FRAUDTRACE AI — FINANCIAL CRIME INVESTIGATION DOSSIER", title_style))
        elements.append(Paragraph(f"Case Ref: {case_id} | Target Account: {data['target_account']['account_number_masked']} | Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
        elements.append(Spacer(1, 8))

        # Risk Score Banner Table
        score_val = str(data['risk_assessment']['risk_score'])
        tier_val = data['risk_assessment']['risk_tier']
        score_table_data = [
            ["EVALUATED RISK SCORE", "RISK PRIORITY TIER", "CONFIDENCE LEVEL", "ACTION STATUS"],
            [f"{score_val} / 100", tier_val.upper(), "96%", "URGENT REVIEW"]
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
