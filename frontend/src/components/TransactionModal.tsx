import React, { useState, useEffect } from 'react';
import stockApi from '../services/stockApi';
import { TransactionModalProps, TransactionType, Transaction } from '../types';
import './TransactionModal.css';

interface TemporaryTransaction {
  ticker: string;
  transaction_type: TransactionType;
  date: string;
  quantity: number;
  tempId: number;
}

interface FormState {
  ticker: string;
  transaction_type: TransactionType;
  date: string;
  quantity: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  stockTicker,
  initialData = null
}) => {
  const [transactions, setTransactions] = useState<TemporaryTransaction[]>([]);
  const [currentForm, setCurrentForm] = useState<FormState>({
    ticker: stockTicker || '',
    transaction_type: 'BUY',
    date: '',
    quantity: ''
  });
  const [pricePreview, setPricePreview] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      // Edit mode
      setIsEditMode(true);
      setCurrentForm({
        ticker: initialData.ticker,
        transaction_type: initialData.transaction_type,
        date: initialData.date,
        quantity: initialData.quantity.toString()
      });
    } else if (stockTicker) {
      setCurrentForm(prev => ({
        ...prev,
        ticker: stockTicker
      }));
    }
  }, [initialData, stockTicker]);

  // Fetch price preview when date and ticker change
  useEffect(() => {
    const fetchPricePreview = async (): Promise<void> => {
      if (currentForm.ticker && currentForm.date) {
        try {
          const data = await stockApi.getStockHistory(
            currentForm.ticker.toUpperCase().trim(),
            '5d',
            '1d'
          );
          const selectedDate = new Date(currentForm.date).toISOString().split('T')[0];
          const priceData = (data as any).prices?.find((p: any) => p.date === selectedDate);
          if (priceData) {
            setPricePreview(priceData.close);
          } else {
            setPricePreview(null);
          }
        } catch (err) {
          setPricePreview(null);
        }
      }
    };

    const debounce = setTimeout(fetchPricePreview, 500);
    return () => clearTimeout(debounce);
  }, [currentForm.ticker, currentForm.date]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setCurrentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeToggle = (type: TransactionType): void => {
    setCurrentForm(prev => ({
      ...prev,
      transaction_type: type
    }));
  };

  const handleQuickDate = (daysAgo: number): void => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    setCurrentForm(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
  };

  const handleQuantityChange = (delta: number): void => {
    const currentQty = parseInt(currentForm.quantity) || 0;
    const newQty = Math.max(1, currentQty + delta);
    setCurrentForm(prev => ({
      ...prev,
      quantity: newQty.toString()
    }));
  };

  const validateForm = (): boolean => {
    if (!currentForm.ticker.trim()) {
      setError('종목 티커를 입력해주세요');
      return false;
    }
    if (!currentForm.date) {
      setError('날짜를 선택해주세요');
      return false;
    }
    if (!currentForm.quantity || parseInt(currentForm.quantity) <= 0) {
      setError('올바른 수량을 입력해주세요');
      return false;
    }
    return true;
  };

  const handleAddToList = (): void => {
    setError('');

    if (!validateForm()) {
      return;
    }

    const transaction: TemporaryTransaction = {
      ticker: currentForm.ticker.toUpperCase().trim(),
      transaction_type: currentForm.transaction_type,
      date: currentForm.date,
      quantity: parseInt(currentForm.quantity),
      tempId: Date.now() + Math.random()
    };

    setTransactions([...transactions, transaction]);

    // Keep ticker and reset other fields
    setCurrentForm(prev => ({
      ...prev,
      date: '',
      quantity: ''
    }));
    setPricePreview(null);
  };

  const handleRemoveFromList = (tempId: number): void => {
    setTransactions(transactions.filter(t => t.tempId !== tempId));
  };

  const handleSubmitAll = async (): Promise<void> => {
    setError('');
    setLoading(true);

    try {
      if (isEditMode) {
        // Edit mode: submit single transaction
        if (!validateForm()) {
          setLoading(false);
          return;
        }

        const submitData = {
          ticker: currentForm.ticker.toUpperCase().trim(),
          transaction_type: currentForm.transaction_type,
          date: currentForm.date,
          quantity: parseInt(currentForm.quantity)
        };

        await onSubmit(submitData);
      } else {
        // Add mode: submit all transactions in the list
        if (transactions.length === 0) {
          setError('추가할 거래가 없습니다. 먼저 거래를 목록에 추가해주세요.');
          setLoading(false);
          return;
        }

        for (const transaction of transactions) {
          const submitData = {
            ticker: transaction.ticker,
            transaction_type: transaction.transaction_type,
            date: transaction.date,
            quantity: transaction.quantity
          };
          await onSubmit(submitData);
        }
      }

      // Success - close modal and reset
      setTransactions([]);
      setCurrentForm({
        ticker: stockTicker || '',
        transaction_type: 'BUY',
        date: '',
        quantity: ''
      });
      setPricePreview(null);
      setIsEditMode(false);
      onClose();
    } catch (err: any) {
      setError(err.error || err.message || '거래 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transaction-modal-enhanced" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? '거래 수정' : '거래 추가'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="transaction-form">
          {/* Ticker Input */}
          <div className="form-group">
            <label htmlFor="ticker">종목 티커</label>
            <input
              id="ticker"
              name="ticker"
              type="text"
              value={currentForm.ticker}
              onChange={handleChange}
              placeholder="예: AAPL"
              className="form-input"
              disabled={loading || !!stockTicker || isEditMode}
              autoFocus={!stockTicker}
            />
          </div>

          {/* Transaction Type Toggle */}
          <div className="form-group">
            <label>거래 유형</label>
            <div className="toggle-switch">
              <button
                type="button"
                className={`toggle-button ${currentForm.transaction_type === 'BUY' ? 'active buy' : ''}`}
                onClick={() => handleTypeToggle('BUY')}
                disabled={loading}
              >
                매수
              </button>
              <button
                type="button"
                className={`toggle-button ${currentForm.transaction_type === 'SELL' ? 'active sell' : ''}`}
                onClick={() => handleTypeToggle('SELL')}
                disabled={loading}
              >
                매도
              </button>
            </div>
          </div>

          {/* Date Input with Quick Buttons */}
          <div className="form-group">
            <label htmlFor="date">날짜</label>
            <div className="date-input-group">
              <input
                id="date"
                name="date"
                type="date"
                value={currentForm.date}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
              <div className="quick-date-buttons">
                <button type="button" onClick={() => handleQuickDate(0)} disabled={loading}>오늘</button>
                <button type="button" onClick={() => handleQuickDate(1)} disabled={loading}>어제</button>
                <button type="button" onClick={() => handleQuickDate(7)} disabled={loading}>1주일 전</button>
                <button type="button" onClick={() => handleQuickDate(30)} disabled={loading}>1개월 전</button>
              </div>
            </div>
            {pricePreview && (
              <div className="price-preview">
                예상 종가: ${pricePreview.toFixed(2)}
              </div>
            )}
          </div>

          {/* Quantity Input with +/- Buttons */}
          <div className="form-group">
            <label htmlFor="quantity">수량</label>
            <div className="quantity-input-group">
              <button
                type="button"
                className="qty-button"
                onClick={() => handleQuantityChange(-10)}
                disabled={loading}
              >
                -10
              </button>
              <button
                type="button"
                className="qty-button"
                onClick={() => handleQuantityChange(-1)}
                disabled={loading}
              >
                -1
              </button>
              <input
                id="quantity"
                name="quantity"
                type="number"
                value={currentForm.quantity}
                onChange={handleChange}
                placeholder="주식 수"
                className="form-input quantity-input"
                disabled={loading}
                min="1"
                step="1"
              />
              <button
                type="button"
                className="qty-button"
                onClick={() => handleQuantityChange(1)}
                disabled={loading}
              >
                +1
              </button>
              <button
                type="button"
                className="qty-button"
                onClick={() => handleQuantityChange(10)}
                disabled={loading}
              >
                +10
              </button>
            </div>
            <div className="quick-qty-buttons">
              <button type="button" onClick={() => setCurrentForm(prev => ({...prev, quantity: '10'}))} disabled={loading}>10주</button>
              <button type="button" onClick={() => setCurrentForm(prev => ({...prev, quantity: '50'}))} disabled={loading}>50주</button>
              <button type="button" onClick={() => setCurrentForm(prev => ({...prev, quantity: '100'}))} disabled={loading}>100주</button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Add to List Button (only in add mode) */}
          {!isEditMode && (
            <button
              type="button"
              className="add-to-list-button"
              onClick={handleAddToList}
              disabled={loading}
            >
              목록에 추가 ➕
            </button>
          )}

          {/* Transaction List */}
          {!isEditMode && transactions.length > 0 && (
            <div className="transaction-list-preview">
              <h4>추가할 거래 ({transactions.length}개)</h4>
              <div className="transaction-items">
                {transactions.map((t) => (
                  <div key={t.tempId} className="transaction-item">
                    <span className={`transaction-badge ${t.transaction_type === 'BUY' ? 'buy' : 'sell'}`}>
                      {t.transaction_type === 'BUY' ? '매수' : '매도'}
                    </span>
                    <span className="transaction-detail">{t.ticker}</span>
                    <span className="transaction-detail">{t.date}</span>
                    <span className="transaction-detail">{t.quantity}주</span>
                    <button
                      type="button"
                      className="remove-item-button"
                      onClick={() => handleRemoveFromList(t.tempId)}
                      disabled={loading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button" disabled={loading}>
              취소
            </button>
            <button type="button" onClick={handleSubmitAll} className="submit-button" disabled={loading}>
              {loading ? '저장 중...' : (isEditMode ? '수정' : `모두 저장 (${transactions.length}개)`)}
            </button>
          </div>

          <p className="transaction-note">
            💡 팁: 여러 거래를 추가한 후 한번에 저장할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
