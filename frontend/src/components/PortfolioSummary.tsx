import React, { useState, useEffect } from 'react';
import stockApi from '../services/stockApi';
import { Portfolio } from '../types';
import './PortfolioSummary.css';

interface PortfolioSummaryProps {
  refreshTrigger?: number;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ refreshTrigger = 0 }) => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchPortfolio();
  }, [refreshTrigger]);

  const fetchPortfolio = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await stockApi.getPortfolioSummary();
      setPortfolio(data);
    } catch (err) {
      setError('포트폴리오 로드에 실패했습니다');
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async (): Promise<void> => {
    try {
      await stockApi.exportPortfolioCSV();
    } catch (err) {
      alert('CSV 내보내기에 실패했습니다');
      console.error('Error exporting CSV:', err);
    }
  };

  if (loading) {
    return <div className="portfolio-loading">포트폴리오 로딩 중...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!portfolio || portfolio.portfolio.length === 0) {
    return (
      <div className="portfolio-empty">
        <h3>포트폴리오 요약</h3>
        <p>아직 보유 종목이 없습니다. 거래를 추가해보세요!</p>
      </div>
    );
  }

  const { portfolio: holdings, summary } = portfolio;
  const totalProfitLoss = (summary?.total_current_value || 0) - (summary?.total_invested || 0);
  const totalProfitLossPercent = (summary?.total_invested || 0) > 0
    ? (totalProfitLoss / summary.total_invested) * 100
    : 0;

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <h3>포트폴리오 요약</h3>
        <button className="export-button" onClick={handleExportCSV}>
          CSV 내보내기
        </button>
      </div>

      <div className="portfolio-summary-cards">
        <div className="summary-card">
          <div className="summary-label">총 투자금액</div>
          <div className="summary-value">${(summary?.total_invested || 0).toFixed(2)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">현재 가치</div>
          <div className="summary-value">${(summary?.total_current_value || 0).toFixed(2)}</div>
        </div>

        <div className={`summary-card ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
          <div className="summary-label">총 손익</div>
          <div className="summary-value">
            {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
            <span className="summary-percent">
              ({totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="holdings-list">
        <h4>보유 종목</h4>
        <div className="holdings-table">
          <div className="holdings-header">
            <div className="col-ticker">티커</div>
            <div className="col-quantity">수량</div>
            <div className="col-avg-price">평균 단가</div>
            <div className="col-current-price">현재가</div>
            <div className="col-value">총 가치</div>
            <div className="col-pl">손익</div>
          </div>

          {holdings.map((holding) => {
            const profitLoss = (holding?.current_value || 0) - (holding?.total_cost || 0);
            const profitLossPercent = (holding?.total_cost || 0) > 0
              ? (profitLoss / holding.total_cost) * 100
              : 0;

            return (
              <div key={holding.ticker} className="holdings-row">
                <div className="col-ticker">
                  <span className="ticker-symbol">{holding.ticker}</span>
                </div>
                <div className="col-quantity">{holding?.quantity || 0}</div>
                <div className="col-avg-price">${(holding?.average_price || 0).toFixed(2)}</div>
                <div className="col-current-price">${(holding?.current_price || 0).toFixed(2)}</div>
                <div className="col-value">${(holding?.current_value || 0).toFixed(2)}</div>
                <div className={`col-pl ${profitLoss >= 0 ? 'profit' : 'loss'}`}>
                  <div className="pl-amount">
                    {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                  </div>
                  <div className="pl-percent">
                    ({profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
