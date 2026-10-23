import {
  DashboardData,
  DossierData,
  WatchlistEntry,
  InvestigationNote
} from '../types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchDashboardData(accountId: string = 'ACC-4321'): Promise<DashboardData> {
  const res = await fetch(`${API_BASE_URL}/overview?focused_account_id=${encodeURIComponent(accountId)}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

export function getEmptyDashboardData(accountId: string = ''): DashboardData {
  return {
    kpis: {
      high_risk_accounts: 0,
      high_risk_trend: '0% of portfolio',
      suspicious_networks: 0,
      networks_trend: '0 active clusters',
      linked_complaints: 0,
      complaints_trend: '0 verified by cyber cell',
      total_transactions_analyzed: '0',
      transactions_timeframe: 'No transaction records'
    },
    risky_accounts: [],
    focused_account: accountId,
    flow_analysis: {
      account_id: accountId,
      account_number_masked: accountId ? `Account ${accountId}` : 'N/A',
      risk_score: 0,
      incoming_total: 0,
      incoming_total_formatted: '₹0',
      incoming_count: 0,
      layering_total: 0,
      layering_total_formatted: '₹0',
      layering_count: 0,
      outflow_total: 0,
      outflow_total_formatted: '₹0',
      outflow_count: 0,
      retained_balance: 0,
      retained_percentage: 0
    },
    timeline: [],
    risk_explanation: {
      account_id: accountId,
      account_number_masked: accountId ? `Account ${accountId}` : 'N/A',
      risk_score: 0,
      risk_tier: 'Low',
      confidence: 0,
      top_contributing_factors: [],
      disclaimer: 'No account records present in database.'
    },
    linked_complaints: [],
    associated_entities: [],
    network_graph: {
      target_node_id: accountId,
      nodes: [],
      edges: []
    }
  };
}

// ============================================================================
// Case Action Persistence APIs
// ============================================================================

export async function fetchDossierJson(accountId: string): Promise<DossierData> {
  const res = await fetch(`${API_BASE_URL}/reports/dossier-json/${encodeURIComponent(accountId)}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.detail || `Failed to fetch dossier (${res.status} ${res.statusText})`;
    const error = new Error(message);
    (error as any).status = res.status;
    throw error;
  }
  return await res.json();
}

export async function addToWatchlist(
  accountId: string,
  reason: string = 'Flagged during investigation',
  priority: string = 'HIGH',
  investigatorId?: string
): Promise<WatchlistEntry> {
  const res = await fetch(`${API_BASE_URL}/cases/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: accountId,
      reason,
      priority,
      investigator_id: investigatorId
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const error = new Error(errData.detail || `Failed to add to watchlist (${res.status})`);
    (error as any).status = res.status;
    throw error;
  }
  return await res.json();
}

export async function fetchWatchlist(): Promise<WatchlistEntry[]> {
  const res = await fetch(`${API_BASE_URL}/cases/watchlist?is_active=true`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Failed to load watchlist (${res.status})`);
  }
  return await res.json();
}

export async function removeFromWatchlist(accountId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/cases/watchlist/${encodeURIComponent(accountId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const error = new Error(errData.detail || `Failed to remove from watchlist (${res.status})`);
    (error as any).status = res.status;
    throw error;
  }
  return await res.json();
}

export async function createInvestigationNote(
  accountId: string,
  noteText: string,
  caseId?: string,
  author?: string
): Promise<InvestigationNote> {
  const res = await fetch(`${API_BASE_URL}/cases/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: accountId,
      note_text: noteText,
      case_id: caseId,
      author
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const error = new Error(errData.detail || `Failed to save investigation note (${res.status})`);
    (error as any).status = res.status;
    throw error;
  }
  return await res.json();
}

export async function fetchInvestigationNotes(accountId: string): Promise<InvestigationNote[]> {
  const res = await fetch(`${API_BASE_URL}/cases/notes/${encodeURIComponent(accountId)}`, {
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Failed to load investigation notes (${res.status})`);
  }
  return await res.json();
}

export async function fetchAccounts(riskTier?: string): Promise<import('../types').FullAccount[]> {
  const url = riskTier
    ? `${API_BASE_URL}/accounts?risk_tier=${encodeURIComponent(riskTier)}`
    : `${API_BASE_URL}/accounts?limit=100`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load accounts (${res.status})`);
  return await res.json();
}

export async function fetchTransactions(accountId?: string, limit: number = 100): Promise<import('../types').FullTransaction[]> {
  const url = accountId
    ? `${API_BASE_URL}/transactions?account_id=${encodeURIComponent(accountId)}&limit=${limit}`
    : `${API_BASE_URL}/transactions?limit=${limit}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load transactions (${res.status})`);
  return await res.json();
}

export async function fetchComplaints(limit: number = 100): Promise<import('../types').CybercrimeComplaint[]> {
  const res = await fetch(`${API_BASE_URL}/complaints?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load complaints (${res.status})`);
  return await res.json();
}

export async function fetchNetworkGraph(accountId: string = 'ACC-4321', maxDepth: number = 2): Promise<import('../types').NetworkGraphData> {
  const res = await fetch(`${API_BASE_URL}/graph/network/${encodeURIComponent(accountId)}?max_depth=${maxDepth}`, {
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`Failed to load network graph (${res.status})`);
  return await res.json();
}

export async function fetchMoneyTrail(accountId: string, direction: string = 'both'): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/money-trail/${encodeURIComponent(accountId)}?direction=${encodeURIComponent(direction)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load money trail (${res.status})`);
  return await res.json();
}

export async function fetchAuditLogs(limit: number = 50): Promise<import('../types').AuditLogEntry[]> {
  const res = await fetch(`${API_BASE_URL}/cases/audit-logs?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load audit logs (${res.status})`);
  return await res.json();
}

export async function reseedDatabase(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/cases/reseed`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to reseed database (${res.status})`);
  return await res.json();
}

export async function fetchSolvedCases(
  category?: string,
  search?: string
): Promise<import('../types').SolvedCase[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);

  const url = `${API_BASE_URL}/cases/solved-cases${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load solved cases (${res.status})`);
  return await res.json();
}

export async function createSolvedCase(
  payload: any
): Promise<import('../types').SolvedCase> {
  const res = await fetch(`${API_BASE_URL}/cases/solved-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Failed to create solved case (${res.status})`);
  }
  return await res.json();
}

export async function fetchSolvedCaseById(
  caseId: string
): Promise<import('../types').SolvedCase> {
  const res = await fetch(`${API_BASE_URL}/cases/solved-cases/${caseId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load solved case details (${res.status})`);
  return await res.json();
}

export async function queryCopilot(
  query: string,
  context?: {
    active_tab?: string;
    focused_account_id?: string;
    focused_case_id?: string;
  }
): Promise<import('../types').CopilotResponse> {
  const res = await fetch(`${API_BASE_URL}/copilot/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      active_tab: context?.active_tab,
      focused_account_id: context?.focused_account_id,
      focused_case_id: context?.focused_case_id,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `AI Copilot query failed (${res.status})`);
  }
  return await res.json();
}



