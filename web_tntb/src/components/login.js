import React, { useState } from 'react';
import '../css/Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import background from '../img/bg.svg';
import avatar from '../img/avatar.svg';

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('dongnguyen1589@gmail.com');
    const [password, setPassword] = useState('123456789');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleFocus = (e) => {
        const parent = e.target.closest('.input-div');
        if (parent) {
            parent.classList.add('focus');
        }
    };

    const handleBlur = (e) => {
        const parent = e.target.closest('.input-div');
        if (parent && e.target.value === '') {
            parent.classList.remove('focus');
        }
    };

    const checkCredentials = async (e) => {
        e.preventDefault();
        if (!isValidEmail(username)) {
            setMessage('Email không hợp lệ. Vui lòng nhập địa chỉ email hợp lệ.');
            return;
        }

        if (password.length < 6) {
            setMessage('Mật khẩu phải có ít nhất 6 kí tự.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, username, password);
            const uid = userCredential.user.uid;
            const userDocRef = doc(db, 'user', uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role === 'admin') {
                    setMessage('Đăng nhập thành công!');
                    navigate('/slidebar'); 
                } else {
                    setMessage('Bạn không có quyền truy cập.');
                }
            } else {
                setMessage('Không tìm thấy thông tin người dùng.');
            }
        } catch (error) {
            console.error('Lỗi đăng nhập', error);
            setMessage('Tên đăng nhập hoặc mật khẩu không đúng');
        } finally {
            setLoading(false);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="container">
            <img className="wave" src={require('../img/wave.png')} alt="wave" />
            <div className="img">
                <img src={background} alt="background" />
            </div>
            <div className="login-content">
                <form onSubmit={checkCredentials}>
                    <img src={avatar} alt="avatar" />
                    <h2 className="title">Welcome</h2>
                    <div className="input-div one">
                        <div className="i">
                            <FontAwesomeIcon icon={faUser} />
                        </div>
                        <div className="div">
                            <input
                                type="email"
                                className="input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                placeholder='Email'
                            />
                        </div>
                    </div>
                    <div className="input-div pass">
                        <div className="i">
                            <FontAwesomeIcon icon={faLock} />
                        </div>
                        <div className="password-wrapper">
                            <div className="password-container">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="password-input"
                                    style={{border:'none'}}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    placeholder='Mật khẩu'
                                />
                                <button
                                    type="button"
                                    onClick={toggleShowPassword}
                                    className="toggle-password-btn">
                                    {showPassword ? 'Ẩn' : 'Hiện'}
                                </button>
                            </div>
                        </div>

                    </div>
                    <a href="/forgot-password">Quên mật khẩu?</a>
                    <input type="submit" className="btn_login" value={loading ? 'Đang đăng nhập...' : 'Đăng nhập'} disabled={loading} />
                    {message && <div className="success-message">{message}</div>}
                </form>
            </div>
        </div>
    );
};

export default Login;
