export type UserRole = 'Admin' | 'Support Agent' | 'Analyst';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isAnalyst: boolean;
}

export interface Customer {
  id: number;
  customer_id: string;
  full_name: string;
  email: string;
  phone?: string;
  tenure_months: number;
  contract_type: string;
  payment_method: string;
  monthly_spending: number;
  account_status: string;
  created_at: string;
  updated_at?: string;
  latest_churn_risk?: 'Low' | 'Medium' | 'High';
  latest_churn_probability?: number;
}

export interface CustomerDetail {
  customer: Customer & { contributing_factors?: string[] };
  complaints: ComplaintSummary[];
  transactions: Transaction[];
  interactions: Interaction[];
}

export interface ComplaintSummary {
  id: number;
  complaint_id: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
}

export interface Interaction {
  id: number;
  customer_id: number;
  channel: string;
  raw_text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  model_version: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  customer_id: number;
  transaction_id: string;
  transaction_ref: string;
  amount: number;
  expected_amount?: number;
  currency: string;
  status: string;
  transaction_date: string;
}

export interface Complaint {
  id: number;
  complaint_id: string;
  customer_id: number;
  customer_name?: string;
  category: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved' | 'Closed';
  assigned_agent_id?: number;
  assigned_agent_name?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

export interface ComplaintStatusHistory {
  id: number;
  old_status?: string;
  new_status: string;
  notes?: string;
  timestamp: string;
}

export interface Dispute {
  id: number;
  dispute_id: string;
  customer_id: number;
  customer_name?: string;
  transaction_id?: number;
  transaction_ref?: string;
  complaint_id?: number;
  detection_reasons: string[];
  risk_priority: 'Low' | 'Medium' | 'High' | 'Critical';
  suggested_action: string;
  human_review_required: boolean;
  status: 'Detected' | 'Under Review' | 'Approved' | 'Rejected' | 'Resolved';
  reviewed_by_id?: number;
  reviewer_name?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Recommendation {
  id: number;
  recommendation_id: string;
  customer_id: number;
  customer_name?: string;
  complaint_id?: number;
  dispute_id?: number;
  recommended_action: string;
  reason: string;
  supporting_evidence: string;
  recommended_priority: 'Low' | 'Medium' | 'High' | 'Critical';
  approval_status: 'Pending' | 'Approved' | 'Rejected' | 'Modified';
  reviewer_id?: number;
  reviewer_name?: string;
  reviewer_notes?: string;
  review_timestamp?: string;
  created_at: string;
}

export interface DashboardOverview {
  total_customers: number;
  total_complaints: number;
  open_complaints: number;
  resolved_complaints: number;
  disputes_requiring_review: number;
  high_churn_risk_customers: number;
  avg_resolution_time_hours: number;
  sentiment_distribution: { [key: string]: number };
  complaint_category_distribution: { [key: string]: number };
  churn_risk_distribution: { [key: string]: number };
  recent_complaints: Complaint[];
  recent_disputes: Dispute[];
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface ChurnPredictionResult {
  customer_id?: number;
  churn_probability: number;
  churn_risk_tier: 'Low' | 'Medium' | 'High';
  contributing_factors: string[];
  model_version: string;
  is_fallback: boolean;
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  model_version: string;
  is_fallback: boolean;
}
