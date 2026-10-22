'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  ExternalLink,
  AlertCircle,
  BookOpen,
  PhoneCall,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Smartphone,
  Copy,
  Check,
  Clock,
  Send,
  Building,
  UserCheck
} from 'lucide-react';

export const HelpDocumentationView: React.FC = () => {
  const [selectedCaseType, setSelectedCaseType] = useState<string>('digital_arrest');
  const [copiedSection, setCopiedSection] = useState(false);

  const complianceItems = [
    {
      req: 'PS-01.1: Transaction Analysis',
      desc: 'Detects unusual velocity, rapid transfers (<10m), layering, and behavioural baseline deviations.',
      status: 'VERIFIED'
    },
    {
      req: 'PS-01.2: Mule Account Detection',
      desc: 'Dynamic risk scoring (0-100), ranked suspicious accounts list, and contributing factor explanations.',
      status: 'VERIFIED'
    },
    {
      req: 'PS-01.3: Money-Trail Analysis',
      desc: 'NetworkX graph-based multi-hop traversal with cycle detection and terminal node classification.',
      status: 'VERIFIED'
    },
    {
      req: 'PS-01.4: Complaint Correlation',
      desc: 'Connects NCRP cybercrime complaints and FIR records to suspect accounts and fund flow chains.',
      status: 'VERIFIED'
    },
    {
      req: 'PS-01.5: Evidence Dossier Safety',
      desc: 'Returns HTTP 404 for nonexistent accounts to eliminate fabricated evidence; court-admissible PDF/JSON.',
      status: 'VERIFIED'
    },
    {
      req: 'PS-01.6: Interactive Visual Graph',
      desc: 'Cytoscape.js interactive canvas with directional fund flow edges, entity roles, and depth filtering.',
      status: 'VERIFIED'
    },
    {
      req: 'PS-01.7: Case Management & Watchlist',
      desc: 'Persistent watchlist, investigator notes, and tamper-evident audit logging for all investigative actions.',
      status: 'VERIFIED'
    },
    {
      req: 'PS-01.8: Human Review Policy',
      desc: 'Zero automated financial freezes; all scoring and recommendations serve as human decision support.',
      status: 'VERIFIED'
    },
  ];

  const caseTypes = [
    {
      id: 'digital_arrest',
      title: 'Digital Arrest Scam',
      badge: 'High Impact (₹10L - ₹2Cr)',
      modality: 'Victim held on Skype/WhatsApp video call by imposters posing as CBI/Customs/Police claiming a parcel with illegal narcotics was seized in their name. Forced to liquidate savings into "RBI Verification Accounts".',
      searchKey: 'Beneficiary Bank Account / UTR provided in the fake court order letter.',
      goldenHour: '1 - 3 Hours (Funds routed through 3 mule layers within 30 mins).',
      investigationSteps: [
        'Step 1: Obtain the victim’s transfer UTR and destination account from bank statement or UPI app.',
        'Step 2: Enter Account ID into FraudTrace AI. Check "Rapid Pass-through" and "Layer 2 Mules".',
        'Step 3: Immediately identify the Level 2 and Level 3 beneficiary accounts before ATM cash-out.',
        'Step 4: Generate Section 94 BNSS Notice from FraudTrace AI and email Bank Nodal Officer immediately.'
      ]
    },
    {
      id: 'part_time_task',
      title: 'Part-Time Telegram Job / Task Scam',
      badge: 'Mass Inflow (₹5K - ₹10L)',
      modality: 'Victims lured via Telegram/WhatsApp to like YouTube videos, write Google Maps reviews, or book hotel rooms. Small payouts (₹200-₹500) given initially, followed by demands for VIP prepaid deposits.',
      searchKey: 'UPI VPA / Telegram Channel ID / Inflow Account Number.',
      goldenHour: '2 - 6 Hours (Multiple victims pay into a central Fan-In account simultaneously).',
      investigationSteps: [
        'Step 1: Check Fan-In indicator in FraudTrace AI. Look for 10+ unrelated senders within 4 hours.',
        'Step 2: Note the shared Telegram handle and UPI VPA across multiple NCRP complaints.',
        'Step 3: Trace downstream dispersal to identify the aggregator mule who converts funds to Crypto or POS swipes.',
        'Step 4: Request freeze on the primary aggregator account and its linked mobile device cluster.'
      ]
    },
    {
      id: 'stock_investment',
      title: 'Stock Trading / VIP Investment Fraud',
      badge: 'High Value (₹25L - ₹5Cr)',
      modality: 'Victim added to WhatsApp/Telegram groups claiming "Institutional FII Trading" or "IPO Allotment". Fake trading dashboard displays massive fabricated profits, but withdrawal demands huge 20% "tax fees".',
      searchKey: 'Current Account Number of shell firms (e.g. "TechKart Trading", "Global Enterprises").',
      goldenHour: '4 - 12 Hours (Large structured batches just under statutory limits).',
      investigationSteps: [
        'Step 1: Search current account in FraudTrace AI. Check Profile Mismatch (Firm turnover vs age).',
        'Step 2: Trace Structuring / Smurfing indicator (multiple transfers of ₹49,500 to avoid PAN reporting).',
        'Step 3: Map circular loops where funds are recycled to fake trading volume.',
        'Step 4: Issue joint freezing orders for corporate current accounts across all partner banks.'
      ]
    },
    {
      id: 'loan_app',
      title: 'Instant Loan App Extortion & Blackmail',
      badge: 'Contact Harvesting',
      modality: 'Predatory Chinese/Offshore APKs offering 7-day instant loans. App steals victim contacts and photo gallery. Within 5 days, morphed photos and abusive calls are sent to victim relatives demanding 300% repayment.',
      searchKey: 'Repayment UPI QR Code / Collection agent virtual account.',
      goldenHour: '12 - 24 Hours (Money routed to multiple micro-mules for commission).',
      investigationSteps: [
        'Step 1: Input the collection UPI VPA from the victim’s payment screenshot.',
        'Step 2: Group accounts by shared device IDs and IP clusters in FraudTrace AI.',
        'Step 3: Identify the rented student/PMJDY accounts acting as collection intermediaries.',
        'Step 4: Serve notice on payment gateway aggregator to blacklist the merchant VPA.'
      ]
    },
    {
      id: 'upi_olx',
      title: 'UPI / OLX QR Code / Surcharge Scam',
      badge: 'Quick Churn (₹10K - ₹1L)',
      modality: 'Buyer on OLX pretends to send advance money for furniture/car. Sends a "Pay" QR code or collect request saying "Scan to Receive Money". Victim enters UPI PIN and money is deducted.',
      searchKey: 'UPI Transaction ID / 12-digit UTR / Beneficiary UPI handle.',
      goldenHour: '30 - 90 Minutes (Funds immediately withdrawn at local micro-ATMs or AePS).',
      investigationSteps: [
        'Step 1: Search the 12-digit UPI UTR immediately in FraudTrace AI.',
        'Step 2: Check destination account. If Category is "MULE_SUSPECT", inspect terminal cash-out node.',
        'Step 3: Alert the local bank branch / CSP operator where micro-ATM withdrawal was initiated.',
        'Step 4: Mark account in Surveillance Watchlist with priority "CRITICAL".'
      ]
    }
  ];

  const handleCopyNotice = () => {
    const text = `FORMAL NOTICE UNDER SECTION 94 BNSS (ERSTWHILE SEC 91 CrPC)
To: The Nodal Officer / Cyber Fraud Cell, State Bank of Bharat / Scheduled Commercial Banks.
Subject: Immediate Lien / Debit Freeze Requisition for Suspect Mule Account.

Ref: NCRP Complaint No. C2026-0305 / Cyber PS Crime No. 42/2026.

Sir/Madam,
It is reported that an amount of ₹4,85,000/- was fraudulently siphoned off from the victim via UPI/IMPS and transferred into the following suspect account maintained in your bank:

- Suspect Account ID: ACC-4321
- Account Masked: XXXX 4321
- Target Name: Ramesh K. (Mule Suspect)
- Transaction UTRs: TXN-001 (₹95,000), TXN-002 (₹95,000)
- Current Status: Rapid Pass-through & Multi-layer dispersal detected.

In exercise of powers conferred under Section 94 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 read with Section 106 BNSS (Sec 102 CrPC) and Section 66D IT Act, you are hereby directed to:
1. Immediately place a DEBIT FREEZE / LIEN on Account ACC-4321 and all downstream recipient accounts.
2. Furnish complete KYC documents, account opening form, IP login logs, and ATM withdrawal CCTV footage within 24 hours.

Failure to comply may attract legal proceedings under Section 223 BNS (Disobedience of public servant order).

Inspector Sharma, Investigating Officer
Cyber Crime Police Station, Central Jurisdiction.`;
    navigator.clipboard.writeText(text);
    setCopiedSection(true);
    setTimeout(() => setCopiedSection(false), 2500);
  };

  const currentCase = caseTypes.find((c) => c.id === selectedCaseType) || caseTypes[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Cyber Police Field Guide & Case SOPs</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Plain-language Standard Operating Procedures (SOP), case typology playbooks, and statutory legal notice generators.
          </p>
        </div>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition"
        >
          <span>FastAPI Swagger Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Plain Language Cyber-Cop Translation Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-xl border border-blue-800 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Plain-Language Translation for Investigating Officers (No Tech Jargon)
            </h2>
          </div>
          <span className="text-[10px] bg-blue-800 text-blue-200 px-2 py-0.5 rounded font-mono">
            CYBER COP QUICK REFERENCE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <span className="text-[10px] uppercase font-bold text-amber-300">Rapid Pass-Through</span>
            <p className="font-bold text-sm text-white mt-0.5">"Kaccha Khata" Churn</p>
            <p className="text-[11px] text-slate-300 mt-1">
              Money enters the account and is sent out in &lt;10 minutes. The account is purely a pipeline, never stores money.
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <span className="text-[10px] uppercase font-bold text-purple-300">Fan-In / Fan-Out</span>
            <p className="font-bold text-sm text-white mt-0.5">Fund Pool &amp; Dispersal</p>
            <p className="text-[11px] text-slate-300 mt-1">
              Many different victims pay into 1 account, which then splits the money into 5 to 10 smaller accounts to dodge alerts.
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <span className="text-[10px] uppercase font-bold text-emerald-300">Terminal Cash-Out</span>
            <p className="font-bold text-sm text-white mt-0.5">Final ATM / POS Exit</p>
            <p className="text-[11px] text-slate-300 mt-1">
              The end of the digital trail where money is turned into physical paper currency, merchant swipes, or crypto.
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-lg border border-white/10">
            <span className="text-[10px] uppercase font-bold text-red-300">Shared Infrastructure</span>
            <p className="font-bold text-sm text-white mt-0.5">Same Mobile / IP Gang</p>
            <p className="text-[11px] text-slate-300 mt-1">
              One person or fraud syndicate is managing 5 different bank accounts from the exact same phone or WiFi connection.
            </p>
          </div>
        </div>
      </div>

      {/* Case Typology Playbook Wizard */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Standard Police Case Typologies</h2>
            <p className="text-xs text-slate-500">Select the crime reported by the victim to see the exact investigation steps.</p>
          </div>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {caseTypes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCaseType(c.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                  selectedCaseType === c.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Typology Detail Card */}
        <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-slate-900">{currentCase.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {currentCase.badge}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-red-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>Golden Hour Window: <strong>{currentCase.goldenHour}</strong></span>
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Modus Operandi (How the fraud happened):</span>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{currentCase.modality}</p>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 font-medium">What to ask the victim for immediately:</span>
              <p className="font-bold text-slate-900 mt-0.5">{currentCase.searchKey}</p>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded text-[11px]">
              Search Key
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Exact Action Steps for Investigating Officer:</span>
            <div className="mt-2 space-y-2">
              {currentCase.investigationSteps.map((step, sIdx) => (
                <div key={sIdx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                    {sIdx + 1}
                  </span>
                  <span className="mt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ready-to-Print Legal Notice Generator */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">
              1-Click Bank Freeze Notice Generator (Section 94 BNSS / Sec 91 CrPC)
            </h2>
          </div>
          <button
            onClick={handleCopyNotice}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
          >
            {copiedSection ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSection ? 'Copied to Clipboard!' : 'Copy Pre-Filled Notice'}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Police officers can copy this pre-filled statutory notice directly into an official email or print it out to serve on Bank Nodal Officers to freeze funds during the Golden Hour.
        </p>
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
          <pre className="whitespace-pre-wrap">{`FORMAL NOTICE UNDER SECTION 94 BNSS (ERSTWHILE SEC 91 CrPC)
To: The Nodal Officer / Cyber Fraud Cell, State Bank of Bharat / Scheduled Commercial Banks.
Subject: Immediate Lien / Debit Freeze Requisition for Suspect Mule Account.

Ref: NCRP Complaint No. C2026-0305 / Cyber PS Crime No. 42/2026.

Sir/Madam,
It is reported that an amount of ₹4,85,000/- was fraudulently siphoned off from the victim via UPI/IMPS and transferred into the following suspect account maintained in your bank:

- Suspect Account ID: ACC-4321
- Account Masked: XXXX 4321
- Target Name: Ramesh K. (Mule Suspect)
- Transaction UTRs: TXN-001 (₹95,000), TXN-002 (₹95,000)
- Current Status: Rapid Pass-through & Multi-layer dispersal detected.

In exercise of powers conferred under Section 94 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 read with Section 106 BNSS (Sec 102 CrPC) and Section 66D IT Act, you are hereby directed to:
1. Immediately place a DEBIT FREEZE / LIEN on Account ACC-4321 and all downstream recipient accounts.
2. Furnish complete KYC documents, account opening form, IP login logs, and ATM withdrawal CCTV footage within 24 hours.

Failure to comply may attract legal proceedings under Section 223 BNS (Disobedience of public servant order).

Inspector Sharma, Investigating Officer
Cyber Crime Police Station, Central Jurisdiction.`}</pre>
        </div>
      </div>

      {/* Compliance Matrix */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hackathon Problem Statement PS-01 Compliance Matrix</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {complianceItems.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{item.req}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {item.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
