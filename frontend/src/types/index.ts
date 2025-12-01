// User types
export interface User {
  id: number;
  username: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

// Stock types
export interface StockInfo {
  ticker: string;
  name: string;
  current_price?: number;
  currentPrice?: number;
  change: number;
  change_percent?: number;
  changePercent?: number;
  market_cap?: number;
  marketCap?: number;
  volume?: number;
  open?: number;
  previousClose?: number;
  dayLow?: number;
  dayHigh?: number;
  currency?: string;
}

export interface StockDataPoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

export interface StockHistoryData {
  ticker: string;
  data: StockDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  [ticker: string]: number | string | undefined | TransactionMarker;
  buyMarker?: number;
  sellMarker?: number;
  buyInfo?: TransactionMarker;
  sellInfo?: TransactionMarker;
}

// Transaction types
export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: number;
  ticker: string;
  transaction_type: TransactionType;
  quantity: number;
  price: string;
  date: string;
  created_at: string;
}

export interface TransactionInput {
  ticker: string;
  transaction_type: TransactionType;
  quantity: number;
  price?: number;
  date: string;
}

export interface TransactionMarker {
  id: number;
  ticker: string;
  type: TransactionType;
  quantity: number;
  price: string;
  date: string;
  close: number;
}

// Portfolio types
export interface Holding {
  ticker: string;
  quantity: number;
  average_price: number;
  current_price: number;
  current_value: number;
  total_cost: number;
}

export interface PortfolioSummary {
  total_invested: number;
  total_current_value: number;
}

export interface Portfolio {
  portfolio: Holding[];
  summary: PortfolioSummary;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// Component prop types
export interface TimeframeSelectorProps {
  period: string;
  interval: string;
  onPeriodChange: (period: string) => void;
  onIntervalChange: (interval: string) => void;
}

export interface StockChartProps {
  data: StockHistoryData[];
  loading: boolean;
  isAuthenticated: boolean;
  refreshTrigger: number;
}

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: TransactionInput) => Promise<void>;
  stockTicker?: string | null;
  initialData?: Transaction | null;
}

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => Promise<void>;
}
