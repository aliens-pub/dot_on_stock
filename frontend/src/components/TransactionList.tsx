import React, { useState, useEffect } from 'react';
import stockApi from '../services/stockApi';
import TransactionModal from './TransactionModal';
import { Transaction, TransactionInput } from '../types';
import './TransactionList.css';

interface TransactionListProps {
  refreshTrigger?: number;
}

const TransactionList: React.FC<TransactionListProps> = ({ refreshTrigger = 0 }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [filterTicker, setFilterTicker] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

  const fetchTransactions = async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      const data = await stockApi.getTransactions();
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

  const filteredTransactions = filterTicker
    ? transactions.filter(t => t.ticker.toLowerCase().includes(filterTicker.toLowerCase()))
    : transactions;

  const sortedTransactions = [...filteredTransactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (loading) {
    return <div className="transaction-list-loading">거래 내역 로딩 중...</div>;
  }

  return (
    <div className="transaction-list-container">
      <div className="transaction-list-header">
        <h3>거래 내역</h3>
        <input
          type="text"
          placeholder="티커로 필터링..."
          value={filterTicker}
          onChange={(e) => setFilterTicker(e.target.value)}
          className="filter-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {sortedTransactions.length === 0 ? (
        <div className="no-transactions">
          {filterTicker ? '해당 티커의 거래 내역이 없습니다' : '아직 거래 내역이 없습니다'}
        </div>
      ) : (
        <div className="transaction-list">
          {sortedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`transaction-item ${transaction.transaction_type.toLowerCase()}`}
            >
              <div className="transaction-main">
                <div className="transaction-type-badge">
                  {transaction.transaction_type === 'BUY' ? '매수' : '매도'}
                </div>
                <div className="transaction-details">
                  <div className="transaction-ticker">{transaction.ticker}</div>
                  <div className="transaction-date">{transaction.date}</div>
                </div>
                <div className="transaction-numbers">
                  <div className="transaction-quantity">{transaction.quantity} 주</div>
                  <div className="transaction-price">${parseFloat(transaction.price).toFixed(2)}</div>
                  <div className="transaction-total">
                    Total: ${(transaction.quantity * parseFloat(transaction.price)).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="transaction-actions">
                <button
                  onClick={() => handleEdit(transaction)}
                  className="edit-button"
                  title="거래 수정"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(transaction.id)}
                  className="delete-button"
                  title="거래 삭제"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
  );
};

export default TransactionList;
