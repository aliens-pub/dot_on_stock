import React, { useState } from 'react';
import { LoginModalProps } from '../types';
import './LoginModal.css';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!username.trim()) {
      setError('사용자 이름을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onLogin(username.trim());
      setUsername('');
      onClose();
    } catch (err: any) {
      setError(err.error || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>로그인</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">사용자 이름</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용자 이름을 입력하세요"
              className="form-input"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>

          <p className="login-note">
            참고: 존재하지 않는 사용자 이름의 경우 새 계정이 생성됩니다.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
