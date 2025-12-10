import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import StockList from './components/StockList';
import TimeframeSelector from './components/TimeframeSelector';
import StockChart from './components/StockChart';
import StockInfo from './components/StockInfo';
import LoginModal from './components/LoginModal';
import TransactionModal from './components/TransactionModal';
import PortfolioSummary from './components/PortfolioSummary';
import StockChartBackground from './components/StockChartBackground';
import stockApi from './services/stockApi';
import { useAuth } from './contexts/AuthContext';
import { StockInfo as StockInfoType, StockHistoryData, TransactionInput } from './types';
import './App.css';

interface Stock {
  ticker: string;
  name: string;
}

function App() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stocksInfo, setStocksInfo] = useState<StockInfoType[]>([]);
  const [chartData, setChartData] = useState<StockHistoryData[]>([]);
  const [period, setPeriod] = useState<string>('1y');
  const [interval, setInterval] = useState<string>('1d');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [transactionRefreshTrigger, setTransactionRefreshTrigger] = useState<number>(0);

  // Fetch chart data when stocks, period, or interval changes
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      try {
        const tickers = stocks.map(s => s.ticker);
        const data = await stockApi.compareStocks(tickers, period, interval);
        setChartData(data.stocks);
      } catch (err) {
        setError('Failed to fetch chart data');
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (stocks.length > 0) {
      fetchChartData();
    } else {
      setChartData([]);
    }
  }, [stocks, period, interval]);

  const handleAddStock = async (ticker: string): Promise<void> => {
    // Check if stock already exists
    if (stocks.find(s => s.ticker === ticker)) {
      alert('Stock already added!');
      return;
    }

    try {
      // Fetch stock info
      const info = await stockApi.getStockInfo(ticker);

      setStocks([...stocks, { ticker, name: info.name }]);
      setStocksInfo([...stocksInfo, info]);
    } catch (err: any) {
      alert(`Failed to add stock ${ticker}: ${err.error || err}`);
      console.error('Error adding stock:', err);
    }
  };

  const handleRemoveStock = (ticker: string): void => {
    setStocks(stocks.filter(s => s.ticker !== ticker));
    setStocksInfo(stocksInfo.filter(s => s.ticker !== ticker));
  };

  const handlePeriodChange = (newPeriod: string): void => {
    setPeriod(newPeriod);
  };

  const handleIntervalChange = (newInterval: string): void => {
    setInterval(newInterval);
  };

  const handleLogin = async (username: string): Promise<void> => {
    await login(username);
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
  };

  const handleAddTransaction = (ticker: string): void => {
    if (!isAuthenticated) {
      alert('거래를 추가하려면 로그인이 필요합니다');
      setShowLoginModal(true);
      return;
    }
    setSelectedTicker(ticker);
    setShowTransactionModal(true);
  };

  const handleCreateTransaction = async (transactionData: TransactionInput): Promise<void> => {
    try {
      await stockApi.createTransaction(transactionData);
      setTransactionRefreshTrigger(prev => prev + 1);
      setShowTransactionModal(false);
      setSelectedTicker(null);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <StockChartBackground />
        <div className="header-content">
          <div className="header-title">
            <h1>주식 시세 조회</h1>
            <p>주식 가격 검색 및 비교</p>
          </div>
          <div className="header-auth">
            {isAuthenticated ? (
              <div className="user-info">
                <span className="username">{user?.username}님 환영합니다</span>
                <button onClick={handleLogout} className="auth-button logout-button">
                  로그아웃
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="auth-button login-button">
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="App-main">
        <SearchBar onAddStock={handleAddStock} />

        <StockList stocks={stocks} onRemoveStock={handleRemoveStock} />

        {error && <div className="error-message">{error}</div>}

        <StockInfo stocks={stocksInfo} onAddTransaction={handleAddTransaction} />

        {isAuthenticated && (
          <PortfolioSummary refreshTrigger={transactionRefreshTrigger} />
        )}

        <TimeframeSelector
          period={period}
          interval={interval}
          onPeriodChange={handlePeriodChange}
          onIntervalChange={handleIntervalChange}
        />

        <StockChart
          data={chartData}
          loading={loading}
          isAuthenticated={isAuthenticated}
          refreshTrigger={transactionRefreshTrigger}
        />
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTicker(null);
        }}
        onSubmit={handleCreateTransaction}
        stockTicker={selectedTicker}
      />
    </div>
  );
}

export default App;
