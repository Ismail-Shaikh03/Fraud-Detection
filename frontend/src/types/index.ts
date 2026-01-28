export interface TransactionRequest {
  transactionId: string;
  userId: string;
  amount: number;
  merchantId: string;
  merchantCategory: string;
  timestamp: string;
  deviceId: string;
  locationState: string;
  locationCountry: string;
  channel?: string;
  isFraud?: boolean;
}

export interface TriggeredRule {
  ruleName: string;
  points: number;
  explanation: string;
}

export interface FraudEvaluationResponse {
  transactionId: string;
  riskScore: number;
  riskCategory: 'APPROVED' | 'MONITOR' | 'FLAGGED';
  ruleScore: number;
  statisticalScore: number;
  mlScore: number | null;
  zScore: number | null;
  velocityCount: number;
  triggeredRules: TriggeredRule[];
  explanation: string;
  alertCreated: boolean;
  // Additional fields for detail view
  userId?: string;
  amount?: number;
  merchantId?: string;
  merchantCategory?: string;
  deviceId?: string;
  locationState?: string;
  locationCountry?: string;
  timestamp?: string;
  channel?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  approved: number;
  monitor: number;
  flagged: number;
  total: number;
}

export interface UserAnalytics {
  userId: string;
  transactions: FraudEvaluationResponse[];
  stats: {
    total: number;
    approved: number;
    monitor: number;
    flagged: number;
    avgAmount: number;
  };
}

export interface Alert {
  id: number;
  transactionId: string;
  userId: string;
  riskScore: number;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  analystNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
