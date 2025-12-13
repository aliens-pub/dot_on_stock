import axios, { AxiosError } from 'axios';
import {
  User,
  LoginResponse,
  StockInfo,
  Transaction,
  TransactionInput,
  Portfolio,
  StockHistoryData
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/stocks';

// Configure axios to send credentials (cookies) with requests
axios.defaults.withCredentials = true;

interface CompareStocksResponse {
  stocks: StockHistoryData[];
}

const handleError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; detail?: string }>;
    throw axiosError.response?.data || axiosError.message;
  }
  throw error;
};

const stockApi = {
  // Authentication APIs
  login: async (username: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login/`, { username });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await axios.get<User>(`${API_BASE_URL}/auth/me/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await axios.post<{ message: string }>(`${API_BASE_URL}/auth/logout/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Transaction APIs
  getTransactions: async (ticker: string | null = null): Promise<Transaction[]> => {
    try {
      const params = ticker ? { ticker } : {};
      const response = await axios.get<Transaction[]>(`${API_BASE_URL}/transactions/`, { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createTransaction: async (transaction: TransactionInput): Promise<Transaction> => {
    try {
      const response = await axios.post<Transaction>(`${API_BASE_URL}/transactions/`, transaction);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  updateTransaction: async (id: number, transaction: Partial<TransactionInput>): Promise<Transaction> => {
    try {
      const response = await axios.put<Transaction>(`${API_BASE_URL}/transactions/${id}/`, transaction);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteTransaction: async (id: number): Promise<{ message: string }> => {
    try {
      const response = await axios.delete<{ message: string }>(`${API_BASE_URL}/transactions/${id}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getPortfolioSummary: async (): Promise<Portfolio> => {
    try {
      const response = await axios.get<Portfolio>(`${API_BASE_URL}/transactions/portfolio/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  exportPortfolioCSV: async (): Promise<void> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/transactions/portfolio/export/`, {
        responseType: 'blob',
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'portfolio_export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      return handleError(error);
    }
  },

  // Stock data APIs
  getStockInfo: async (ticker: string): Promise<StockInfo> => {
    try {
      const response = await axios.get<StockInfo>(`${API_BASE_URL}/info/${ticker}/`);
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getStockHistory: async (ticker: string, period: string = '1y', interval: string = '1d'): Promise<StockHistoryData> => {
    try {
      const response = await axios.get<StockHistoryData>(`${API_BASE_URL}/history/${ticker}/`, {
        params: { period, interval }
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  compareStocks: async (tickers: string[], period: string = '1y', interval: string = '1d'): Promise<CompareStocksResponse> => {
    try {
      const response = await axios.post<CompareStocksResponse>(`${API_BASE_URL}/compare/`, {
        tickers,
        period,
        interval
      });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  }
};

export default stockApi;
