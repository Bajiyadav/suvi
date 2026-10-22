export interface KpiMetrics {
  high_risk_accounts: number;
  high_risk_trend: string;
  suspicious_networks: number;
  networks_trend: string;
  linked_complaints: number;
  complaints_trend: string;
  total_transactions_analyzed: string;
  transactions_timeframe: string;
}

export interface RiskyAccountItem {
  rank: number;
  account_id: string;
  account_number: string;
  risk_score: number;
  risk_level: string;
  key_indicators: string;
  bank_name: string;
}

export interface FlowAnalysisSummary {
  account_id: string;
  account_number_masked: string;
  risk_score: number;
  incoming_total: number;
  incoming_total_formatted: string;
  incoming_count: number;
  layering_total: number;
  layering_total_formatted: string;
  layering_count: number;
  outflow_total: number;
  outflow_total_formatted: string;
  outflow_count: number;
  retained_balance: number;
  retained_percentage: number;
}

export interface TimelineItem {
  transaction_id: string;
  date_formatted: string;
  time_formatted: string;
  type: string;
  amount: number;
  amount_formatted: string;
  counterparty_masked: string;
  channel: string;
}

export interface ContributingFactor {
  indicator_id: string;
  name: string;
  points_awarded: number;
  max_points: number;
  percentage_impact: number;
  summary: string;
  evidence_references: string[];
  evidence_rows?: Record<string, any>[];
}

export interface RiskExplanation {
  account_id: string;
  account_number_masked: string;
  risk_score: number;
  risk_tier: string;
  confidence: number;
  top_contributing_factors: ContributingFactor[];
  disclaimer: string;
}

export interface CybercrimeComplaint {
  complaint_id: string;
  incident_date: string;
  complaint_type: string;
  reported_loss_amount: number;
  reported_loss_formatted: string;
  status: string;
  linked_accounts_count: number;
}

export interface AssociatedEntity {
  entity_type: string;
  name_or_id: string;
  connections: string;
  risk_level?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'TARGET_ACCOUNT' | 'CONNECTED_ACCOUNT' | 'HIGH_RISK' | 'MERCHANT' | 'COMPLAINT';
  risk_score: number;
  risk_level: string;
  properties?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  amount_formatted: string;
  transaction_count: number;
  type: string;
}

export interface NetworkGraphData {
  target_node_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface DashboardData {
  kpis: KpiMetrics;
  risky_accounts: RiskyAccountItem[];
  focused_account: string;
  flow_analysis: FlowAnalysisSummary;
  timeline: TimelineItem[];
  risk_explanation: RiskExplanation;
  linked_complaints: CybercrimeComplaint[];
  associated_entities: AssociatedEntity[];
  network_graph: NetworkGraphData;
}

export interface DossierMetadata {
  report_id: string;
  case_reference: string;
  generation_timestamp: string;
  generating_agency: string;
  classification: string;
  synthetic_notice: string;
}

export interface TargetAccountDossier {
  account_id: string;
  account_number_masked: string;
  bank_name: string;
  account_holder_name: string;
  registered_mobile: string;
  status: string;
}

export interface InvestigativeConclusions {
  recommended_action: string;
  rationale: string;
}

export interface DossierData {
  dossier_metadata: DossierMetadata;
  target_account: TargetAccountDossier;
  risk_assessment: RiskExplanation;
  transaction_flow_analysis: FlowAnalysisSummary;
  money_trail_sequence: {
    root_account_id: string;
    total_hops_traced: number;
    hops: any[];
  };
  linked_cybercrime_complaints: CybercrimeComplaint[];
  associated_entities: AssociatedEntity[];
  investigative_conclusions: InvestigativeConclusions;
}

export interface WatchlistEntry {
  entry_id: string;
  account_id: string;
  account_number_masked?: string;
  bank_name?: string;
  risk_score?: number;
  reason?: string;
  priority: string;
  added_at: string;
  investigator_id?: string;
  is_active: boolean;
  removed_at?: string;
}

export interface InvestigationNote {
  note_id: string;
  account_id: string;
  case_id?: string;
  note_text: string;
  author?: string;
  created_at: string;
}

export interface FullAccount {
  account_id: string;
  account_number_masked: string;
  bank_name: string;
  branch_code?: string;
  account_holder_name: string;
  account_type: string;
  account_category: string;
  registered_mobile_masked: string;
  upi_vpa?: string;
  opened_date: string;
  current_balance: number;
  status: string;
  risk_score: number;
  risk_tier: string;
  key_indicators?: string;
}

export interface FullTransaction {
  transaction_id: string;
  sender_account_id: string;
  receiver_account_id: string;
  amount: number;
  timestamp: string;
  channel: string;
  narrative?: string;
  status: string;
  pattern_tag?: string;
  location?: string;
  sender_masked?: string;
  receiver_masked?: string;
}

export interface AuditLogEntry {
  audit_id?: string;
  log_id?: string;
  timestamp: string;
  action_type?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  target_entity?: string;
  actor?: string;
  investigator_id?: string;
  status?: string;
  details?: Record<string, any> | string;
}

export interface SolvedCase {
  case_id: string;
  fir_number: string;
  police_station: string;
  district: string;
  state: string;
  investigating_officer: string;
  crime_category: string;
  total_fraud_amount: number;
  recovered_amount: number;
  date_solved: string;
  case_status: string;

  // Accused / Mule Operative Details
  accused_name: string;
  father_name?: string;
  age?: number;
  address: string;
  mobile_number: string;
  alternate_mobile?: string;
  id_proof?: string;

  // Banking & Fast-Layering Profile
  bank_name: string;
  account_number: string;
  ifsc_code?: string;
  branch_name?: string;
  bank_registered_mobile: string;
  upi_id?: string;
  layering_speed_minutes: number;
  layering_route: string;

  // Investigation & Seizure Memo
  modus_operandi: string;
  breakthrough_trail: string;
  seized_items?: string;
  national_portal_ref?: string;
  created_at?: string;
}


