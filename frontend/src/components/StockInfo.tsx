import React, { useState } from 'react';
import { StockInfo as StockInfoType } from '../types';
import TransactionHistoryModal from './TransactionHistoryModal';
import './StockInfo.css';

interface StockInfoProps {
  stocks: StockInfoType[];
  onAddTransaction?: (ticker: string) => void;
}

const StockInfo: React.FC<StockInfoProps> = ({ stocks, onAddTransaction }) => {
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  if (stocks.length === 0) {
    return null;
  }

  const handleViewHistory = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowHistoryModal(true);
  };

  const formatNumber = (num: number | null | undefined): string => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (num: number | null | undefined, currency: string = 'USD'): string => {
    if (!num) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(num);
  };

  const formatPercent = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return 'N/A';
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const formatMarketCap = (num: number | null | undefined): string => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return formatCurrency(num);
  };

  return (
    <div className="stock-info-container">
      <h3>종목 정보</h3>
      <div className="stock-info-grid">
        {stocks.map((stock) => {
          const currentPrice = stock.currentPrice || stock.current_price;
          const changePercent = stock.changePercent || stock.change_percent;
          const marketCap = stock.marketCap || stock.market_cap;
          const currency = stock.currency || 'USD';

          return (
            <div key={stock.ticker} className="stock-card">
              <div className="stock-header">
                <h4>{stock.ticker}</h4>
                <p className="stock-company-name">{stock.name}</p>
              </div>

              <div className="stock-price">
                <span className="price-value">
                  {formatCurrency(currentPrice, currency)}
                </span>
                <span className={`price-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(stock.change, currency)} ({formatPercent(changePercent)})
                </span>
              </div>

              <div className="stock-details">
                <div className="detail-row">
                  <span className="detail-label">시가:</span>
                  <span className="detail-value">{formatCurrency(stock.open, currency)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">전일 종가:</span>
                  <span className="detail-value">{formatCurrency(stock.previousClose, currency)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">당일 범위:</span>
                  <span className="detail-value">
                    {formatCurrency(stock.dayLow, currency)} - {formatCurrency(stock.dayHigh, currency)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">거래량:</span>
                  <span className="detail-value">{formatNumber(stock.volume)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">시가총액:</span>
                  <span className="detail-value">{formatMarketCap(marketCap)}</span>
                </div>
              </div>

              {onAddTransaction && (
                <div className="stock-actions">
                  <button
                    className="add-transaction-button"
                    onClick={() => onAddTransaction(stock.ticker)}
                  >
                    거래 추가
                  </button>
                  <button
                    className="view-history-button"
                    onClick={() => handleViewHistory(stock.ticker)}
                  >
                    거래 내역 확인
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TransactionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedTicker(null);
        }}
        ticker={selectedTicker}
      />
    </div>
  );
};

export default StockInfo;
