import React from 'react';
import { TimeframeSelectorProps } from '../types';
import './TimeframeSelector.css';

interface PeriodOption {
  value: string;
  label: string;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  period,
  interval,
  onPeriodChange,
  onIntervalChange
}) => {
  const periods: PeriodOption[] = [
    { value: '1mo', label: '1개월' },
    { value: '3mo', label: '3개월' },
    { value: '6mo', label: '6개월' },
    { value: '1y', label: '1년' },
    { value: '2y', label: '2년' },
    { value: '5y', label: '5년' },
    { value: 'max', label: '전체' }
  ];

  const intervals: PeriodOption[] = [
    { value: '1d', label: '일별' },
    { value: '1wk', label: '주별' },
    { value: '1mo', label: '월별' }
  ];

  return (
    <div className="timeframe-selector">
      <div className="selector-group">
        <label>기간:</label>
        <div className="button-group">
          {periods.map((p) => (
            <button
              key={p.value}
              className={`selector-button ${period === p.value ? 'active' : ''}`}
              onClick={() => onPeriodChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-group">
        <label>간격:</label>
        <div className="button-group">
          {intervals.map((i) => (
            <button
              key={i.value}
              className={`selector-button ${interval === i.value ? 'active' : ''}`}
              onClick={() => onIntervalChange(i.value)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeframeSelector;
