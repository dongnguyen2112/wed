// ForgotPassword.js
import React, { useState } from 'react';
import { auth } from '../firebase'; // Import auth từ firebase.js
import { sendPasswordResetEmail } from 'firebase/auth'; // Import sendPasswordResetEmail từ firebase/auth
import '../css/Forgot_password.css'; // Import file CSS cho styling

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendEmail = () => {
    if (!email.trim()) {
      alert('Vui lòng nhập địa chỉ email.');
      return;
    }

    setLoading(true);
    
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert('Đã gửi link reset password đến email của bạn!');
        setEmail(''); // Reset trường email sau khi gửi thành công
      })
      .catch((error) => alert('Lỗi: ' + error.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="forgot-password">
      <div className="forgot-password__container">
        <h2 className="forgot-password__header">Quên Mật Khẩu</h2>
        <input
          type="email"
          placeholder="Nhập địa chỉ email của bạn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="forgot-password__input"
        />
        <button onClick={handleSendEmail} className="forgot-password__button" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi Email'}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
