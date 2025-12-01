import React from 'react';
import './StockList.css';

interface Stock {
  ticker: string;
  name: string;
}

interface StockListProps {
  stocks: Stock[];
  onRemoveStock: (ticker: string) => void;
}

const StockList: React.FC<StockListProps> = ({ stocks, onRemoveStock }) => {
  if (stocks.length === 0) {
    return (
      <div className="stock-list-empty">
        <p>아직 추가된 종목이 없습니다. 주식을 검색해보세요!</p>
      </div>
    );
  }

  return (
    <div className="stock-list">
      <h3>선택한 종목</h3>
      <div className="stock-items">
        {stocks.map((stock) => (
          <div key={stock.ticker} className="stock-item">
            <div className="stock-info">
              <span className="stock-ticker">{stock.ticker}</span>
              <span className="stock-name">{stock.name}</span>
            </div>
            <button
              className="remove-button"
              onClick={() => onRemoveStock(stock.ticker)}
              title="종목 제거"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockList;
