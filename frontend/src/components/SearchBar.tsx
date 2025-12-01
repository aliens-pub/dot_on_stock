import React, { useState } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onAddStock: (ticker: string) => Promise<void>;
}

const SearchBar: React.FC<SearchBarProps> = ({ onAddStock }) => {
  const [ticker, setTicker] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (ticker.trim()) {
      onAddStock(ticker.trim().toUpperCase());
      setTicker('');
    }
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="종목 티커를 입력하세요 (예: NVDA, AAPL)"
          className="search-input"
        />
        <button type="submit" className="search-button">
          주식 추가
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
