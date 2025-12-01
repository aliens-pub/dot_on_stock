import React, { useState, useEffect } from 'react';
import stockApi from '../services/stockApi';
import TransactionModal from './TransactionModal';
import { Transaction, TransactionInput } from '../types';
import './TransactionHistoryModal.css';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker?: string | null;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, ticker }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, ticker]);

  const fetchTransactions = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await stockApi.getTransactions(ticker);
      setTransactions(data);
    } catch (err) {
      setError('거래 내역 로드에 실패했습니다');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction): void => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm('이 거래를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await stockApi.deleteTransaction(id);
      await fetchTransactions();
    } catch (err: any) {
      alert('거래 삭제에 실패했습니다: ' + (err.error || err.message));
      console.error('Error deleting transaction:', err);
    }
  };

  const handleUpdateTransaction = async (updatedData: TransactionInput): Promise<void> => {
    try {
      if (editingTransaction) {
        await stockApi.updateTransaction(editingTransaction.id, updatedData);
        await fetchTransactions();
        setShowEditModal(false);
        setEditingTransaction(null);
      }
    } catch (err) {
      throw err;
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transaction-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{ticker ? `${ticker} 거래 내역` : '전체 거래 내역'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="transaction-history-body">
          {loading && <div className="loading-message">거래 내역 로딩 중...</div>}

          {error && <div className="error-message">{error}</div>}

          {!loading && sortedTransactions.length === 0 && (
            <div className="no-transactions">
              {ticker ? `${ticker}의 거래 내역이 없습니다` : '아직 거래 내역이 없습니다'}
            </div>
          )}

          {!loading && sortedTransactions.length > 0 && (
            <div className="transaction-list-compact">
              {sortedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`transaction-card-compact ${transaction.transaction_type.toLowerCase()}`}
                >
                  <div className="transaction-card-header">
                    <span className={`transaction-type-label ${transaction.transaction_type.toLowerCase()}`}>
                      {transaction.transaction_type === 'BUY' ? '매수' : '매도'}
                    </span>
                    <span className="transaction-ticker">{transaction.ticker}</span>
                    <span className="transaction-date">{transaction.date}</span>
                  </div>

                  <div className="transaction-card-body">
                    <div className="transaction-info-group">
                      <span className="info-label">수량:</span>
                      <span className="info-value">{transaction.quantity}주</span>
                    </div>
                    <div className="transaction-info-group">
                      <span className="info-label">단가:</span>
                      <span className="info-value">${parseFloat(transaction.price).toFixed(2)}</span>
                    </div>
                    <div className="transaction-info-group">
                      <span className="info-label">총액:</span>
                      <span className="info-value total">${(transaction.quantity * parseFloat(transaction.price)).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="transaction-card-actions">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="action-btn edit-btn"
                      title="수정"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="action-btn delete-btn"
                      title="삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showEditModal && editingTransaction && (
          <TransactionModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingTransaction(null);
            }}
            onSubmit={handleUpdateTransaction}
            initialData={editingTransaction}
          />
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryModal;
